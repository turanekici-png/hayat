import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#f6fafc] px-4 py-20 text-center">
        <p className="text-sm font-black uppercase tracking-[.2em] text-hayat-green">404</p>
        <h1 className="text-3xl font-black text-hayat-dark md:text-4xl">Aradığınız sayfa bulunamadı</h1>
        <p className="max-w-md text-slate-500">
          Bu bağlantı kaldırılmış veya adres yanlış yazılmış olabilir. Ana sayfaya dönerek devam edebilirsiniz.
        </p>
        <Link href="/" className="mt-2 rounded-full bg-hayat-green px-6 py-3 text-sm font-black text-white">
          Ana Sayfaya Dön
        </Link>
      </main>
      <Footer />
    </>
  );
}
