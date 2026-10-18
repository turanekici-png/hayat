import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { VisitTracker } from "@/components/VisitTracker";
import { TopInfoBar } from "@/components/TopInfoBar";
import { getSiteSettings, phoneHref } from "@/lib/site-settings";

// Fontlar build sirasinda indirilip siteyle birlikte sunulur (Google'a ek istek yok,
// sayfa cizimini bloklamaz).
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope"
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
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
  return (
    <html lang="tr" className={`${manrope.variable} ${plusJakartaSans.variable}`}>
      <body>
        <VisitTracker />
        <TopInfoBar affiliationNote={settings.affiliationNote} registryNo={settings.registryNo} phone={settings.phone} phoneHref={phoneHref(settings.phone)} />
        {children}
      </body>
    </html>
  );
}
