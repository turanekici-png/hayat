import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SacrificeForm } from "@/components/SacrificeForm";

export default function KurbanPage() {
  return <><Header /><main className="bg-hayat-soft"><section className="mx-auto grid max-w-[1840px] gap-10 px-3 py-16 sm:px-4 md:grid-cols-[1fr_.9fr] lg:px-4"><div><p className="font-bold text-hayat-green">KURBAN ORGANİZASYONU</p><h1 className="mt-3 text-5xl font-black text-hayat-dark">Kurban, adak, akika ve şükür kayıtları</h1><p className="mt-5 text-lg leading-8 text-[#5d6b70]">Bağışçı bilgileri, hisse sayısı, açıklama ve tutar bilgileri kayıt altına alınır. Admin panelden kesim ve dağıtım süreci takip edilebilir.</p><div className="mt-8 rounded-[20px] border border-hayat-border bg-white p-6 shadow-stk"><b>Not:</b> Canlı POS bağlantısı kurulduğunda kurban kayıtları da online ödeme ile ilişkilendirilebilir.</div></div><SacrificeForm /></section></main><Footer /></>;
}
