"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "./Header";
import type { HomeCopy, Language, SectionId, Theme } from "../../data/home";
import { createClient } from "../../../src/lib/supabase/client";

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
  const supabase = useMemo(() => createClient(), []);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSignedIn(Boolean(data.session));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const accountHref = signedIn ? "/account/profile" : "/account/login";
  const accountLabel = signedIn
    ? props.language === "ar" ? "حسابي" : "My account"
    : props.language === "ar" ? "تسجيل الدخول" : "Sign in";

  return <Header {...props} accountHref={accountHref} accountLabel={accountLabel} />;
}
