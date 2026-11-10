"""Exercise recovery decisions without touching systemd or a real web service."""
import fcntl
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[2] / 'ops/website-healthcheck.sh'


class HealthcheckTest(unittest.TestCase):
    def run_case(self, codes='200', active='1', grace=False, cooldown=False, locked=False, reports=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            state = root / 'state'
            state.mkdir()
            if cooldown:
                import time
                (state / 'last-restart').write_text(str(int(time.time())))
            script = root / 'check.sh'
            script.write_text(SOURCE.read_text().replace('/var/lib/nour-website-health', str(state))
                              .replace('/var/lib/nour-website-reports', str(root / 'reports'))
                              .replace('/run/lock/nour-website-deploy.lock', str(root / 'lock')))
            fake = root / 'bin'
            fake.mkdir()
            commands = {
                'systemctl': '''#!/usr/bin/env python3
import os,sys,time
from pathlib import Path
p=Path(os.environ['CASE_ROOT'])
a=sys.argv[1:]
with (p/'calls').open('a') as f: f.write(' '.join(a)+'\\n')
if a[0]=='is-active':
 n=int((p/'active-count').read_text()) if (p/'active-count').exists() else 0
 (p/'active-count').write_text(str(n+1))
 states=os.environ['ACTIVE'].split(',')
 sys.exit(0 if states[min(n,len(states)-1)]=='1' else 3)
if 'ExecMainStartTimestamp' in a:
 print(time.strftime('%Y-%m-%d %H:%M:%S UTC',time.gmtime()) if os.environ['GRACE']=='1' else '1970-01-01 UTC')
elif 'MainPID' in a: print('0')
elif 'Environment' in a and os.environ['REPORTS']=='1': print('NODE_OPTIONS=--report-on-signal')
''',
                'curl': '''#!/usr/bin/env python3
import os,sys
from pathlib import Path
p=Path(os.environ['CASE_ROOT'])/'probes'
n=int(p.read_text()) if p.exists() else 0
p.write_text(str(n+1))
codes=os.environ['CODES'].split(',')
code=codes[min(n,len(codes)-1)]
print(code,end='')
sys.exit(28 if code=='000' else 0)
''',
                'journalctl': '#!/bin/sh\necho diagnostic-journal\n',
                'sleep': '#!/bin/sh\nexit 0\n',
            }
            for name, content in commands.items():
                path = fake / name
                path.write_text(content)
                path.chmod(0o755)
            env = dict(os.environ, PATH=f'{fake}:' + os.environ['PATH'], CASE_ROOT=str(root),
                       CODES=codes, ACTIVE=active, GRACE=str(int(grace)), REPORTS=str(int(reports)))
            with (root / 'lock').open('w') as lock:
                if locked:
                    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                result = subprocess.run(['bash', str(script)], env=env, capture_output=True, text=True)
            calls = (root / 'calls').read_text() if (root / 'calls').exists() else ''
            return result, calls, len(list(state.glob('incident-*.log')))

    def test_healthy(self):
        result, calls, logs = self.run_case()
        self.assertEqual(result.returncode, 0)
        self.assertNotIn('restart ', calls)
        self.assertEqual(logs, 0)

    def test_transient_failure_does_not_restart(self):
        result, calls, _ = self.run_case('000,200')
        self.assertEqual(result.returncode, 0)
        self.assertNotIn('restart ', calls)

    def test_hang_recovers_and_keeps_diagnostics(self):
        result, calls, logs = self.run_case('000,000,000,200')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(calls.count('restart nour-website.service'), 1)
        self.assertEqual(logs, 1)
        self.assertIn('restored', result.stdout)

    def test_http_error_is_failure(self):
        result, calls, _ = self.run_case('503,503,503,200')
        self.assertEqual(result.returncode, 0)
        self.assertIn('restart ', calls)

    def test_signal_only_when_reports_enabled(self):
        for enabled in (False, True):
            result, calls, _ = self.run_case('000,000,000,200', reports=enabled)
            self.assertEqual(result.returncode, 0)
            self.assertEqual('kill --kill-who=main --signal=SIGUSR2' in calls, enabled)

    def test_failed_recovery_is_reported(self):
        result, calls, _ = self.run_case('000')
        self.assertEqual(result.returncode, 1)
        self.assertIn('did not recover', result.stderr)
        self.assertEqual(calls.count('restart nour-website.service'), 1)

    def test_cooldown_prevents_restart_loop(self):
        result, calls, _ = self.run_case('000', cooldown=True)
        self.assertEqual(result.returncode, 1)
        self.assertNotIn('restart ', calls)

    def test_manual_stop_startup_and_deployment_are_respected(self):
        for options in ({'active': '0'}, {'grace': True}, {'locked': True},
                        {'active': '1,0', 'codes': '000'}):
            with self.subTest(options=options):
                result, calls, _ = self.run_case(**options)
                self.assertEqual(result.returncode, 0)
                self.assertNotIn('restart ', calls)


if __name__ == '__main__':
    unittest.main()
