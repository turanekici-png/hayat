import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { VisitTracker } from "@/components/VisitTracker";
import { TopInfoBar } from "@/components/TopInfoBar";
import { PendingDonationNotice } from "@/components/PendingDonationNotice";
import { Suspense } from "react";
import { applicationHref, getSiteSettings, isExternalUrl, phoneHref } from "@/lib/site-settings";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";

// Fontlar depoda bulunur: sunucu derlemesinde de ziyaret sirasinda da
// Google Fonts'a baglanti gerekmez. Dosyalar Turkce karakterleri de icerir.
const manrope = localFont({
  src: "./fonts/manrope-variable.ttf",
  weight: "400 800",
  style: "normal",
  display: "swap",
  variable: "--font-manrope"
});

const plusJakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans-variable.ttf",
  weight: "600 800",
  style: "normal",
  display: "swap",
  variable: "--font-jakarta"
});

export const metadata: Metadata = {
  title: "Hayat Ağacı Derneği",
  description: "Dayanışmayı büyüten modern yardım ve bağış platformu",
  icons: {
    icon: "/media/brand/hayat-agaci-logo.jpg",
    apple: "/media/brand/hayat-agaci-logo.jpg"
  }
};

// Ust bilgi seridi ve footer admin panelinden duzenlenen Site Ayarlari'ni okur; statik
// uretilen sayfalarda bu bilgiler build anindaki haliyle donup kalmasin diye dinamik.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const publicSettings = {
    applicationsEnabled: settings.applicationsEnabled,
    applicationHref: applicationHref(settings),
    applicationIsExternal: isExternalUrl(applicationHref(settings))
  };
  return (
    <html lang="tr" className={`${manrope.variable} ${plusJakartaSans.variable}`}>
      <body>
        <SiteSettingsProvider value={publicSettings}>
          <VisitTracker />
          <TopInfoBar affiliationNote={settings.affiliationNote} registryNo={settings.registryNo} phone={settings.phone} phoneHref={phoneHref(settings.phone)} />
          {children}
          <Suspense fallback={null}>
            <PendingDonationNotice />
          </Suspense>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
