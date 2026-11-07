import {execFileSync} from 'node:child_process';
import {readdirSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const env=readFileSync('.env.local','utf8');
assert.match(env,/^NEXT_PUBLIC_SUPABASE_URL=http:\/\/(127\.0\.0\.1|localhost):54331\s*$/m,'Only the isolated local environment is permitted');
const db='supabase_db_nour-intake-local';
const history=new Set(execFileSync('docker',['exec',db,'psql','-U','postgres','-d','postgres','-At','-c','select version from supabase_migrations.schema_migrations'],{encoding:'utf8'}).trim().split(/\r?\n/));
let sql='begin;\n';let count=0;
for(const file of readdirSync('supabase/migrations').sort()){
 const version=file.split('_')[0];
 if(version>='20261101'||history.has(version)||file==='20260729_create_admin_user_roles.sql')continue;
 const source=readFileSync(`supabase/migrations/${file}`,'utf8').replace(/^\uFEFF/,'').replace(/^\s*(begin|commit);\s*$/gmi,'');
 sql+=`\n\\echo Local schema: ${file}\n${source}\ninsert into supabase_migrations.schema_migrations(version,name) values('${version}','${file.replace(/'/g,"''")}');\n`;count++;
}
sql+="\ndrop policy if exists workspace_cities_read on public.departure_cities;create policy workspace_cities_read on public.departure_cities for select to authenticated using(public.workspace_allowed('countries','view'));\nnotify pgrst,'reload schema';\ncommit;\n";
try{const output=execFileSync('docker',['exec','-i',db,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-q'],{input:sql,encoding:'utf8',maxBuffer:8*1024*1024,stdio:['pipe','pipe','pipe']});console.log(output.trim());console.log(`Applied ${count} existing module migrations in one local transaction.`);}catch(error){console.error(String(error.stdout??'').trim().split('\n').slice(-4).join('\n'));console.error(String(error.stderr??'').trim().split('\n').slice(-12).join('\n'));process.exitCode=1;}
