"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../../lib/supabase/client";
import { getPublicPrograms } from "../services/public-programs.service";

export default function usePublicProgramCatalog() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: ["public", "programs"],
    queryFn: () => getPublicPrograms(supabase),
    staleTime: 2 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
