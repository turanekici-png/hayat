import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hayat Ağacı Derneği",
  description: "Dayanışmayı büyüten modern yardım ve bağış platformu",
  icons: {
    icon: "/media/brand/hayat-agaci-logo.jpg",
    apple: "/media/brand/hayat-agaci-logo.jpg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
