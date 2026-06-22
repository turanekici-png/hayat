import React from "react";
import Link from "next/link";

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; redirect?: string }> }) {
  const params = await searchParams;
  const errorMessage = params?.error === "invalid"
    ? "Kullanici adi veya parola hatali."
    : params?.error === "inactive"
      ? "Hesabiniz pasif. Lutfen yoneticinizle gorusun."
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-4 text-2xl font-black text-slate-800">Yonetici Girisi</h1>
        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <form action="/api/admin/login" method="post" className="space-y-4">
          <input type="hidden" name="redirect" value={params?.redirect || "/admin"} />
          <label className="block text-sm font-semibold text-slate-700">Kullanici adi
            <input name="username" type="text" autoComplete="username" required placeholder="Kullanici adinizi girin" className="mt-2 w-full rounded-xl border p-3" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Parola
            <input name="password" type="password" autoComplete="current-password" required placeholder="Parolanizi girin" className="mt-2 w-full rounded-xl border p-3" />
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input name="remember" type="checkbox" className="h-4 w-4" /> Beni hatirla
          </label>
          <div className="flex items-center justify-between">
            <button type="submit" className="rounded-xl bg-hayat-green px-4 py-2 font-black text-white">Giris Yap</button>
            <Link href="/admin" className="text-sm text-slate-500">Iptal</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
