"use client";

import { createContext, useContext, type ReactNode } from "react";

export type PublicSiteSettings = {
  applicationsEnabled: boolean;
  applicationHref: string;
  applicationIsExternal: boolean;
};

const SiteSettingsContext = createContext<PublicSiteSettings>({
  applicationsEnabled: false,
  applicationHref: "/basvuru",
  applicationIsExternal: false
});

/** Admin "Site Ayarlari"ndan gelen ve istemci bilesenlerinin (Header vb.) ihtiyac duydugu ayarlar. */
export function SiteSettingsProvider({ value, children }: { value: PublicSiteSettings; children: ReactNode }) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function usePublicSiteSettings() {
  return useContext(SiteSettingsContext);
}
