"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "./Header";
import type { HomeCopy, Language, SectionId, Theme } from "../../data/home";
import { createClient } from "../../../src/lib/supabase/client";

import { getPilgrimUser } from "../../../src/features/auth/services/account-access";

type Props = {
  t: HomeCopy;
  language: Language;
  theme: Theme;
  menuOpen: boolean;
  activeSection: SectionId;
  navItems: { id: SectionId; label: string }[];
  onLanguageChange: () => void;
  onThemeChange: () => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
};

export default function PublicHeader(props: Props) {
  const supabase = useMemo(() => createClient("pilgrim"), []);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    let version = 0;
    const refresh = async () => {
      const current = ++version;
      try {
        const user = await getPilgrimUser(supabase);
        if (mounted && current === version) setSignedIn(Boolean(user));
      } catch {
        if (mounted && current === version) setSignedIn(false);
      }
    };
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      // Do not call Auth methods inside its state-change lock.
      window.setTimeout(() => {
        if (mounted) void refresh();
      }, 0);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const accountHref = signedIn ? "/account/profile" : "/account/login";
  const accountLabel = signedIn
    ? props.language === "ar"
      ? "حسابي"
      : "My account"
    : props.language === "ar"
      ? "تسجيل الدخول"
      : "Sign in";

  return (
    <Header {...props} accountHref={accountHref} accountLabel={accountLabel} />
  );
}
