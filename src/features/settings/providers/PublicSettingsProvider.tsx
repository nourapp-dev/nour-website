"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { createClient } from "../../../lib/supabase/client";
import {
  getPublicBooleanSetting,
  getPublicNumberSetting,
  getPublicSettingsMap,
  getPublicTextSetting,
  type PublicSettingsMap,
} from "../services/public-settings.service";

type PublicSettingsContextValue = {
  settings: PublicSettingsMap;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;

  getText: (
    settingKey: string,
    fallbackValue?: string,
  ) => string;

  getBoolean: (
    settingKey: string,
    fallbackValue?: boolean,
  ) => boolean;

  getNumber: (
    settingKey: string,
    fallbackValue?: number,
  ) => number;
};

type PublicSettingsProviderProps = {
  children: ReactNode;
};

const PublicSettingsContext =
  createContext<PublicSettingsContextValue | null>(
    null,
  );

export default function PublicSettingsProvider({
  children,
}: PublicSettingsProviderProps) {
  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const settingsQuery = useQuery({
    queryKey: [
      "public",
      "platform-settings",
    ],
    queryFn: () =>
      getPublicSettingsMap(supabase),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: "always",
    retry: 2,
  });

  const settings =
    settingsQuery.data ?? {};

  const value =
    useMemo<PublicSettingsContextValue>(
      () => ({
        settings,
        isLoading:
          settingsQuery.isLoading,
        isError:
          settingsQuery.isError,

        refetch: async () =>
          settingsQuery.refetch(),

        getText: (
          settingKey,
          fallbackValue = "",
        ) =>
          getPublicTextSetting(
            settings,
            settingKey,
            fallbackValue,
          ),

        getBoolean: (
          settingKey,
          fallbackValue = false,
        ) =>
          getPublicBooleanSetting(
            settings,
            settingKey,
            fallbackValue,
          ),

        getNumber: (
          settingKey,
          fallbackValue = 0,
        ) =>
          getPublicNumberSetting(
            settings,
            settingKey,
            fallbackValue,
          ),
      }),
      [
        settings,
        settingsQuery.isLoading,
        settingsQuery.isError,
        settingsQuery.refetch,
      ],
    );

  return (
    <PublicSettingsContext.Provider
      value={value}
    >
      {children}
    </PublicSettingsContext.Provider>
  );
}

export function usePublicSettings() {
  const context = useContext(
    PublicSettingsContext,
  );

  if (!context) {
    throw new Error(
      "usePublicSettings must be used inside PublicSettingsProvider.",
    );
  }

  return context;
}