import Link from "next/link";
import { Header } from "@/components/Header";
import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/Footer";
import { HomePopup } from "@/components/HomePopup";
import { allByType, fallbackSections, firstByType, getHomeSections } from "@/lib/site-content";
import { ArrowRight, CalendarDays, HeartHandshake, Image as ImageIcon, Heart, Play, Users, Video, ChevronRight, ChevronLeft, ShieldCheck, Target } from "lucide-react";
import OldHomePage from "./page-old";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isCorporateIdentitySection(section: any) {
  const title = (section.title || "").toLocaleLowerCase("tr-TR");
  const badge = (section.badge || "").trim().toUpperCase();
  return (
    section.type === "ABOUT" ||
    ["HAKKIMIZDA", "MISYON", "VIZYON"].includes(badge) ||
    title.includes("hakkımızda") ||
    title.includes("misyon") ||
    title.includes("vizyon")
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  if (mode === "classic") {
    return <OldHomePage />;
  }

  const [sections, groupLabels] = await Promise.all([
    getHomeSections(),
    prisma.sectionGroupLabel.findMany()
  ]);

  const hero = firstByType(sections, "HERO") ?? { ...fallbackSections[0], badge: "", subtitle: "", title: "", body: "" };
  const videos = allByType(sections, "VIDEO");
  const campaigns = allByType(sections, "CAMPAIGN");
  const newsSections = allByType(sections, "NEWS");
  const activities = allByType(sections, "ACTIVITY");
  const corporateIdentitySections = sections.filter(isCorporateIdentitySection);
  const gallery = allByType(sections, "GALLERY");
  const cta = firstByType(sections, "CTA");
  
  const now = new Date();
  const [announcements, popup] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }]
      },
      orderBy: [{ isPinned: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 4
    }),
    prisma.popupSetting.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } })
  ]);

  const getLabel = (type: string, fallback: string) => groupLabels.find(l => l.type === type)?.label || fallback;

  const activitiesTitle = activities.find(s => s.customTitle)?.customTitle || getLabel("ACTIVITY", "BAĞIŞ KATEGORİLERİ");
  const campaignsTitle = campaigns.find(s => s.customTitle)?.customTitle || getLabel("CAMPAIGN", "DEVAM EDEN PROJELER");
  const videosTitle = videos.find(s => s.customTitle)?.customTitle || getLabel("VIDEO", "VİDEO BLOG");
  const newsTitle = newsSections.find(s => s.customTitle)?.customTitle || getLabel("NEWS", "BİZDEN HABERLER");
  const galleryTitle = gallery.find(s => s.customTitle)?.customTitle || getLabel("GALLERY", "GALERİ");
  const corporateTitle = corporateIdentitySections.find(s => s.customTitle)?.customTitle || getLabel("ABOUT", "HAKKIMIZDA");

  const stats = [["12.450+", "Ulaşılan aile"], ["7/24", "Online bağış"], ["%100", "Kayıtlı süreç"], ["Güvenli", "Başvuru takibi"]];

  return (
    <div className="min-h-screen bg-white font-montserrat text-hayat-ink selection:bg-hayat-green/10 selection:text-hayat-green overflow-x-hidden">
      <HomePopup popup={popup ? {
        id: popup.id,
        title: popup.title,
        content: popup.content,
        imageUrl: popup.imageUrl,
        imageAlt: popup.imageAlt,
        buttonLabel: popup.buttonLabel,
        buttonUrl: popup.buttonUrl,
        showOnce: popup.showOnce,
        delaySeconds: popup.delaySeconds
      } : null} />
      <Header />
      
      <main>
        {/* 1. HERO SLIDER */}
        <section className="relative h-[450px] md:h-[650px] lg:h-[800px] w-full overflow-hidden bg-black">
          <div className="absolute inset-0">
             {hero.imageUrl ? (
               <img src={hero.imageUrl} className="w-full h-full object-cover" alt="Slider" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-[#343f52] to-[#262b32]" />
             )}
             <div className="absolute inset-0 bg-[#343f52]/20" />
          </div>

          <div className="container mx-auto h-full px-6 relative z-10 lg:px-10 max-w-[1440px] flex flex-col justify-center text-white">
            <div className="max-w-lg"> {/* max-w-xl -> max-w-lg */}
              <div className="flex items-center gap-1 mb-1"> {/* gap-2 -> gap-1, mb-2 -> mb-1 */}
                 <span className="w-8 h-[2px] bg-white rounded-full mb-0.5"></span> {/* w-10 -> w-8, mb-1 -> mb-0.5 */}
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/90">{hero.badge || "Hayat Ağacı Derneği"}</span>
              </div>
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-black leading-[1.05] mb-1 drop-shadow-lg uppercase tracking-tighter"> {/* mb-2 -> mb-1 */}
                {hero.title || "Dünyayı İyilik Değiştirecek"}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl mb-3 leading-relaxed max-w-3xl font-medium text-white/90"> {/* mb-4 -> mb-3 */}
                {hero.body || "Hayat Ağacı Derneği olarak, hayırseverlerin destekleriyle dünyanın her yerindeki ihtiyaç sahiplerine ulaşıyoruz."}
              </p>
              <div className="flex flex-wrap gap-5">
                <Link href="/bagis" className="inline-flex items-center justify-center bg-hayat-orange px-10 py-5 rounded-lg text-white font-black text-sm tracking-[0.1em] shadow-xl transition-all hover:bg-hayat-orangeDark hover:-translate-y-1 active:scale-95 uppercase">
                  ŞİMDİ BAĞIŞ YAP
                </Link>
                <Link href={hero.href || "/kurumsal"} className="inline-flex items-center justify-center border-2 border-white bg-transparent px-10 py-5 rounded-lg text-white font-black text-sm tracking-[0.1em] transition-all hover:bg-white hover:text-hayat-dark hover:-translate-y-1 active:scale-95 uppercase">
                  DETAYLI BİLGİ
                </Link>
              </div>
            </div>
          </div>
          
          <div className="absolute inset-y-0 left-6 flex items-center">
             <button className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all backdrop-blur-sm"><ChevronLeft size={28} /></button>
          </div>
          <div className="absolute inset-y-0 right-6 flex items-center">
             <button className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all backdrop-blur-sm"><ChevronRight size={28} /></button>
          </div>
        </section>

        {/* 2. QUICK DONATION OVERLAY */}
        <section className="container mx-auto px-6 lg:px-10 max-w-[1440px] quick-donation-overlap py-3 bg-white"> {/* py-4 -> py-3, Added bg-white for visual separation */}
           <div className="bg-white rounded-[1.5rem] shadow-stk p-2 md:p-2 flex flex-col lg:flex-row items-center gap-2 border border-[#f0f0f0]"> {/* p-3 -> p-2, gap-3 -> gap-2 */}
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"> {/* gap-3 -> gap-2 */}
                 <div className="relative group h-9"> {/* h-10 -> h-9 */}
                    <select className="w-full h-16 bg-[#f6f7f9] border border-transparent rounded-2xl px-6 font-black text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-hayat-green transition-all appearance-none cursor-pointer text-[#60697b]">
                       <option>Su Kuyusu Projeleri</option>
                       <option>Gıda ve Yardım Paketleri</option>
                       <option>Acil Yardım Bağışı</option>
                       <option>Genel Bağış</option>
                    </select>
                 </div>
                 <div className="relative h-9"> {/* h-10 -> h-9 */}
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-hayat-green text-xl">₺</span>
                    <input type="number" defaultValue="1000" className="w-full h-16 bg-[#f6f7f9] border border-transparent rounded-2xl pl-12 pr-4 font-black text-lg outline-none focus:bg-white focus:border-hayat-green transition-all text-[#343f52]" />
                 </div>
                 <div className="flex gap-1 h-9"> {/* gap-2 -> gap-1, h-10 -> h-9 */}
                    <button className="flex-1 bg-[#f6f7f9] rounded-2xl font-black text-[11px] text-[#60697b] hover:bg-hayat-green hover:text-white transition-all uppercase tracking-widest">100₺</button>
                    <button className="flex-1 bg-[#f6f7f9] rounded-2xl font-black text-[11px] text-[#60697b] hover:bg-hayat-green hover:text-white transition-all uppercase tracking-widest">500₺</button>
                    <button className="flex-1 bg-[#f6f7f9] rounded-2xl font-black text-[11px] text-[#60697b] hover:bg-hayat-green hover:text-white transition-all uppercase tracking-widest">1000₺</button>
                 </div>
              </div>
              <Link href="/bagis" className="w-full lg:w-auto h-14 bg-hayat-green px-10 rounded-2xl text-white font-black text-sm tracking-[0.1em] flex items-center justify-center gap-2 shadow-green transition-all hover:bg-hayat-greenDark hover:scale-[1.02] active:scale-95 uppercase"> {/* h-16 -> h-14, px-12 -> px-10, gap-3 -> gap-2 */}
                 ŞİMDİ DESTEK OL! <Heart size={18} fill="currentColor" />
              </Link>
           </div>
        </section>

        {/* 3. ICON CATEGORIES */}
        {activities.length > 0 && (
          <section className="py-6 bg-[#f6f7f9]"> {/* py-8 -> py-6, Changed to light gray */}
            <div className="container mx-auto px-6 lg:px-10 max-w-[1440px]">
               <div className="text-center mb-4">
                  <h2 className="text-4xl font-black uppercase tracking-tight text-[#343f52] mb-3">{activitiesTitle}</h2> {/* mb-4 -> mb-3 */}
                  <div className="w-20 h-[3px] bg-hayat-green mx-auto rounded-full" />
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8"> {/* gap-12 -> gap-8 */}
                  {activities.map((item) => (
                    <Link href={`#${item.id}`} key={item.id} className="group flex flex-col items-center text-center">
                       <div className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-white flex items-center justify-center mb-10 border border-[#f0f0f0] shadow-stk transition-all group-hover:bg-hayat-green group-hover:text-white group-hover:-translate-y-4 group-hover:shadow-green group-hover:border-transparent">
                          <div className="text-hayat-green transition-all group-hover:text-white group-hover:scale-110 duration-700 mb-1"> {/* mb-2 -> mb-1 */}
                             {item.imageUrl ? <img src={item.imageUrl} className="w-24 h-24 object-contain" /> : <HeartHandshake size={72} strokeWidth={1} />}
                          </div>
                       </div>
                       <span className="text-sm md:text-[15px] font-black uppercase tracking-widest text-[#343f52] group-hover:text-hayat-green transition-colors">{item.title}</span>
                    </Link>
                  ))}
               </div>
            </div>
          </section>
        )}

        {/* 4. ONGOING PROJECTS */}
        {campaigns.length > 0 && (
          <section className="py-8 bg-white border-y border-[#f0f0f0]"> {/* py-10 -> py-8, Changed to white */}
            <div className="container mx-auto px-6 lg:px-10 max-w-[1440px]">
              <div className="text-center mb-6"> {/* mb-8 -> mb-6 */}
                <h2 className="text-5xl font-black uppercase tracking-tight text-[#343f52] mb-0.5">{campaignsTitle}</h2> {/* mb-1 -> mb-0.5 */}
                <div className="w-24 h-[3px] bg-hayat-green mx-auto rounded-full" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
                {campaigns.map((item) => (
                  <div key={item.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-stk transition-all hover:shadow-stk-hover border border-transparent hover:border-[#f0f0f0] flex flex-col h-full hover:-translate-y-3">
                    <div className="relative h-[320px] overflow-hidden">
                      <img src={item.imageUrl || ""} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute top-8 left-8 bg-hayat-green text-white text-[10px] font-black px-6 py-2.5 rounded-xl uppercase tracking-[0.2em] shadow-2xl">
                        {item.badge || "ACİL YARDIM"}
                      </div>
                    </div>
                    <div className="p-3 flex flex-col flex-1"> {/* p-4 -> p-3 */}
                      <h3 className="text-2xl font-black text-[#343f52] mb-1 min-h-[4rem] leading-tight group-hover:text-hayat-green transition-colors uppercase tracking-tight">{item.title}</h3> {/* mb-2 -> mb-1 */}
                      <div className="mt-auto">
                        <div className="bg-[#f6f7f9] p-2 rounded-[2rem] mb-3 border border-[#f0f0f0]"> {/* p-3 -> p-2, mb-4 -> mb-3 */}
                           <div className="flex justify-between items-end mb-5 text-[#343f52]">
                             <div className="text-[11px] font-black uppercase tracking-widest opacity-60">TOPLANAN BAĞIŞ</div>
                             <div className="font-black text-3xl tracking-tighter">75%</div>
                           </div>
                           <div className="progress-bar-container mb-8"><div className="progress-bar-fill w-[75%]" /></div>
                           <div className="flex justify-between">
                              <div className="flex flex-col"><span className="text-[10px] font-black text-[#60697b] uppercase tracking-widest mb-1">Mevcut</span><span className="font-black text-2xl text-[#343f52]">45.000 ₺</span></div>
                              <div className="flex flex-col items-end"><span className="text-[10px] font-black text-[#60697b] uppercase tracking-widest mb-1">Hedef</span><span className="font-black text-2xl text-[#343f52]">60.000 ₺</span></div>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                           <Link href="/bagis" className="bg-hayat-orange h-16 rounded-2xl text-white font-black text-[12px] tracking-widest flex items-center justify-center shadow-orange transition-all hover:bg-hayat-orangeDark uppercase">BAĞIŞ YAP</Link>
                           <Link href="/detay" className="bg-white border-2 border-[#f0f0f0] h-16 rounded-2xl text-[#343f52] font-black text-[12px] tracking-widest flex items-center justify-center transition-all hover:border-hayat-green hover:text-hayat-green uppercase">DETAYLAR</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. VIDEO BLOG */}
        {videos.length > 0 && (
          <section className="py-8 bg-[#f6f7f9]"> {/* py-10 -> py-8, Changed to light gray */}
            <div className="container mx-auto px-6 lg:px-10 max-w-[1440px]">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-4 gap-2">
                <div className="mb-2">
                   <h2 className="text-5xl font-black text-[#343f52] uppercase tracking-tighter">{videosTitle}</h2>
                   <div className="w-20 h-[3px] bg-hayat-green mt-6 rounded-full" />
                </div>
                <Link href="/video" className="inline-flex items-center gap-4 bg-white border-2 border-[#f0f0f0] px-10 py-4.5 rounded-2xl text-[11px] font-black tracking-[0.2em] hover:border-hayat-green hover:text-hayat-green transition-all uppercase">TÜMÜNÜ GÖR <ArrowRight size={18} /></Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                {videos.map((item) => (
                  <div key={item.id} className="group relative aspect-video overflow-hidden rounded-[3rem] shadow-stk transition-all hover:shadow-stk-hover">
                    <img src={item.imageUrl || ""} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-[#343f52]/30 group-hover:bg-[#343f52]/50 transition-all" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-hayat-green shadow-2xl transform transition group-hover:scale-125 duration-700">
                          <Play size={40} className="ml-2" fill="currentColor" />
                       </div>
                    </div>
                    {item.title && <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-[#343f52]/90 to-transparent text-white font-black text-2xl tracking-tight">{item.title}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6. NEWS & ANNOUNCEMENTS */}
        <section className="py-8 bg-white border-y border-[#f0f0f0]"> {/* py-10 -> py-8, Changed to white */}
           <div className="container mx-auto px-6 lg:px-10 max-w-[1440px] grid lg:grid-cols-12 gap-16"> {/* gap-24 -> gap-16 */}
              <div className="lg:col-span-8">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-5xl font-black text-[#343f52] uppercase tracking-tighter">{newsTitle}</h2>
                    <Link href="/haber" className="text-hayat-green font-black text-[11px] tracking-[0.2em] flex items-center gap-4 hover:underline transition-all">TÜMÜ <ArrowRight size={20} /></Link>
                 </div>
                 <div className="grid md:grid-cols-2 gap-12"> {/* gap-16 -> gap-12 */}
                    {newsSections.map((item) => (
                      <div key={item.id} className="bg-white rounded-[3rem] overflow-hidden shadow-stk group hover:shadow-stk-hover transition-all">
                        <div className="h-32 overflow-hidden"><img src={item.imageUrl || ""} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" /></div> {/* h-40 -> h-32 */}
                        <div className="p-3"> {/* p-4 -> p-3 */}
                           <div className="flex items-center gap-2 text-hayat-green font-black text-[10px] uppercase tracking-[0.4em] mb-1"><span className="w-6 h-[2px] bg-hayat-green"></span> HABERLER</div> {/* gap-3 -> gap-2, mb-2 -> mb-1, w-8 -> w-6 */}
                           <h3 className="text-lg font-black text-[#343f52] group-hover:text-hayat-green transition-colors leading-tight mb-1 uppercase tracking-tight">{item.title}</h3> {/* text-xl -> text-lg, mb-2 -> mb-1 */}
                           <p className="text-[#60697b] text-[13px] line-clamp-3 leading-loose mb-2">{item.body}</p> {/* text-[14px] -> text-[13px], mb-3 -> mb-2 */}
                           <Link href="/devami" className="inline-flex items-center gap-4 text-[11px] font-black text-[#343f52] hover:text-hayat-green transition-colors uppercase tracking-[0.2em] border-b-2 border-[#f0f0f0] pb-2">DEVAMINI OKU <ChevronRight size={16} /></Link>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="lg:col-span-4 bg-[#f6f7f9] p-6 rounded-lg shadow-stk"> {/* Added background and padding for announcements */}
                 <h2 className="text-5xl font-black text-[#343f52] uppercase tracking-tighter mb-4">DUYURULAR</h2> {/* mb-6 -> mb-4 */}
                 <div className="space-y-1"> {/* space-y-2 -> space-y-1 */}
                    {announcements.map((item) => (
                      <div key={item.id} className="p-3 rounded-[3rem] bg-white border border-transparent shadow-stk group hover:border-hayat-green transition-all hover:-translate-y-2"> {/* p-4 -> p-3 */}
                         <div className="flex items-center gap-1 text-[9px] font-black text-hayat-green mb-1 bg-[#f0f9f4] w-fit px-3 py-1 rounded-full tracking-widest"><CalendarDays size={12} /> {item.createdAt.toLocaleDateString("tr-TR")}</div> {/* gap-2 -> gap-1, mb-2 -> mb-1, text-[10px] -> text-[9px], px-4 py-1.5 -> px-3 py-1, size={14} -> size={12} */}
                         <h3 className="font-black text-[#343f52] group-hover:text-hayat-green transition-colors text-lg leading-snug uppercase tracking-tight">{item.title}</h3> {/* text-xl -> text-lg */}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* 7. COUNTER BAND */}
        <section className="bg-hayat-green py-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="container mx-auto px-6 lg:px-10 max-w-[1440px] grid grid-cols-2 lg:grid-cols-4 gap-16 text-center relative z-10">
            {stats.map(([value, label], i) => (
              <div key={label} className="flex flex-col items-center group mb-1">
                 <div className="w-16 h-16 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-1 ring-1 ring-white/20 group-hover:bg-white/20 transition-all duration-700 transform group-hover:rotate-12"><Users size={32} /></div>
                 <p className="text-4xl lg:text-5xl font-black mb-0.5 tracking-tighter drop-shadow-2xl">{value}</p>
                 <p className="text-[12px] font-black text-white/80 uppercase tracking-[0.4em]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. CORPORATE IDENTITY */}
        {corporateIdentitySections.length > 0 && (
          <section className="py-10 bg-white overflow-hidden" id="kurumsal">
            <div className="container mx-auto px-6 lg:px-10 max-w-[1440px] grid lg:grid-cols-2 gap-32 items-center">
              <div className="relative">
                <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative z-10 border-[15px] border-white">
                   <img src={corporateIdentitySections[0].imageUrl || "/placeholder.jpg"} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-20 -right-20 w-4/5 h-4/5 bg-[#f6f7f9] rounded-[4rem] -z-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-hayat-green/5 rounded-full blur-[40px] -z-0" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-14 h-14 bg-[#f6f7f9] rounded-2xl flex items-center justify-center text-hayat-green border border-[#f0f0f0]"><ShieldCheck size={28} /></div>
                   <span className="text-[11px] font-black uppercase tracking-[0.5em] text-hayat-green">{corporateIdentitySections[0].badge || "KURUMSAL"}</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-black text-[#343f52] mb-2 leading-[1.05] uppercase tracking-tighter">{corporateTitle}</h2>
                <div className="space-y-3 text-2xl text-[#60697b] leading-relaxed mb-3 font-medium">
                   <p>{corporateIdentitySections[0].body}</p>
                </div>
                <Link href="/kurumsal" className="inline-flex items-center gap-5 bg-[#343f52] text-white h-20 px-16 rounded-[1.25rem] font-black text-sm tracking-[0.3em] hover:bg-hayat-green transition-all shadow-2xl active:scale-95 uppercase">DAHA FAZLA BİLGİ <ArrowRight size={24} /></Link>
              </div>
            </div>
          </section>
        )}

        {/* 9. GALLERY */}
        {gallery.length > 0 && (
          <section className="py-8 bg-[#f6f7f9] border-t border-[#f0f0f0]">
            <div className="container mx-auto px-6 lg:px-10 max-w-[1440px]">
              <div className="text-center mb-6">
                 <h2 className="text-5xl font-black uppercase tracking-tight text-[#343f52] mb-0.5">{galleryTitle}</h2>
                 <div className="w-20 h-[3px] bg-hayat-green mx-auto rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
                {gallery.map((item) => (
                  <div key={item.id} className="aspect-square rounded-[3.5rem] overflow-hidden shadow-stk group relative border-[12px] border-white transition-all hover:scale-[1.05] hover:rotate-2">
                    <img src={item.imageUrl || ""} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
                    <div className="absolute inset-0 bg-hayat-green/60 opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-center justify-center">
                       <ImageIcon size={56} className="text-white transform scale-0 group-hover:scale-100 transition-transform duration-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 10. CTA / FINAL BAND */}
        {cta && (
          <section className="py-8 relative overflow-hidden bg-[#262b32]">
             <div className="absolute inset-0 bg-hayat-green opacity-[0.92]" />
             <div className="container mx-auto px-6 lg:px-10 max-w-[1440px] relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                <div className="text-white max-w-lg text-center lg:text-left mb-1">
                  <h2 className="text-5xl md:text-7xl font-black mb-8 uppercase tracking-tighter drop-shadow-2xl">{cta.title}</h2>
                  <p className="text-white/90 font-medium text-2xl lg:text-3xl leading-relaxed">{cta.body}</p>
                </div>
                <Link href="/bagis" className="shrink-0 bg-white text-[#343f52] px-16 h-20 flex items-center justify-center rounded-[1.5rem] font-black text-xl shadow-2xl transition-all hover:bg-[#f6f7f9] hover:scale-[1.08] active:scale-95 uppercase tracking-tighter"> {/* px-20 -> px-16, h-24 -> h-20, text-2xl -> text-xl */}
                   BİZE DESTEK OLUN
                </Link>
             </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
