import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { VisitTracker } from "@/components/VisitTracker";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${manrope.variable} ${plusJakartaSans.variable}`}>
      <body>
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
