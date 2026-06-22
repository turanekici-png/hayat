import Link from "next/link";
import { Beef, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "../AdminShell";

const labels: Record<string, string> = { NEW: "Yeni", PAID: "Ödendi", ASSIGNED: "Atandı", COMPLETED: "Tamamlandı", CANCELLED: "İptal" };
const typeLabels: Record<string, string> = { KURBAN: "Kurban", ADAK: "Adak", AKIKA: "Akika", SUKUR: "Şükür" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminKurbanPage() {
  const orders = await prisma.sacrificeOrder.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell activePath="/admin/kurban" contentClassName="max-w-7xl">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-[2rem] bg-hayat-dark p-6 text-white md:flex-row md:items-center">
        <div>
          <p className="flex items-center gap-2 font-black uppercase tracking-[.18em] text-hayat-gold">
            <Beef size={18} /> Kurban Organizasyonu
          </p>
          <h1 className="mt-3 text-4xl font-black">Kurban kayıt listesi</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="rounded-full bg-white/10 px-5 py-3 font-black">Admin</Link>
          <Link href="/kurban" className="rounded-full bg-hayat-gold px-5 py-3 font-black text-hayat-dark">
            <Eye className="mr-1 inline" size={16} /> Formu Gör
          </Link>
        </div>
      </div>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="p-3">Kayıt No</th>
                <th className="p-3">Ad Soyad</th>
                <th className="p-3">Telefon</th>
                <th className="p-3">Tür</th>
                <th className="p-3">Hisse</th>
                <th className="p-3">Tutar</th>
                <th className="p-3">Durum</th>
                <th className="p-3">Not</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-3 font-black text-hayat-green">{order.orderNo}</td>
                  <td className="p-3 font-bold">{order.fullName}</td>
                  <td className="p-3">{order.phone || "-"}</td>
                  <td className="p-3">{typeLabels[order.type]}</td>
                  <td className="p-3">{order.shares}</td>
                  <td className="p-3">{order.amount ? `${order.amount.toString()} TL` : "-"}</td>
                  <td className="p-3">{labels[order.status]}</td>
                  <td className="p-3">{order.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && <p className="p-6 text-center text-slate-500">Henüz kurban kaydı yok.</p>}
        </div>
      </section>
    </AdminShell>
  );
}
