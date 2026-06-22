import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { CalendarDays } from "lucide-react";

export const revalidate = 60;

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ann = await prisma.announcement.findUnique({ where: { id } }).catch(() => null);
  if (!ann || !ann.isActive) notFound();

  return (
    <>
      <Header />
      <main className="bg-hayat-soft px-5 py-14 sm:px-8 lg:px-10">
        <article className="mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-soft md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-black uppercase tracking-[.22em] text-hayat-green">{ann.type === "ACIL" ? "Acil" : ann.type === "KAMPANYA" ? "Kampanya" : ann.type === "HABER" ? "Haber" : "Duyuru"}</p>
              <h1 className="mt-3 text-4xl font-black text-hayat-dark md:text-6xl">{ann.title}</h1>
            </div>
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-hayat-mint text-hayat-green">
              <CalendarDays size={32} />
            </div>
          </div>

          <div className="mt-8 whitespace-pre-line rounded-[1.5rem] bg-slate-50 p-6 text-lg font-semibold leading-9 text-slate-700 md:p-8">
            {ann.content}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
