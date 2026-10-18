"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, RotateCcw, X, XCircle } from "lucide-react";
import { clearPendingDonation, readPendingDonation, type PendingDonation } from "@/lib/pending-donation";

type NoticeState =
  | { kind: "paid"; donation: PendingDonation }
  | { kind: "failed"; donation: PendingDonation }
  | { kind: "pending"; donation: PendingDonation }
  | null;

const MAX_POLLS = 8;

/**
 * Bagisci banka odeme sayfasini yarida birakip siteye donerse, son bagisinin
 * gercek durumunu (sunucudan) gosterir: odeme alinmadiysa acikca uyarir ve
 * tekrar denemeye yonlendirir. Admin ve makbuz sayfalarinda gorunmez.
 */
export function PendingDonationNotice() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<NoticeState>(null);
  const polls = useRef(0);

  const hidden = pathname.startsWith("/admin");
  const onReceipt = pathname.startsWith("/bagis/makbuz/");
  const failureShownOnPage = pathname === "/bagis" && searchParams.get("odeme") === "basarisiz";

  const check = useCallback(async () => {
    const pending = readPendingDonation();
    if (!pending) {
      setNotice(null);
      return;
    }

    // Makbuz sayfasi veya bagis sayfasindaki basarisiz odeme uyarisi zaten durumu anlatiyor.
    if ((onReceipt && pathname.endsWith(`/${pending.id}`)) || failureShownOnPage) {
      clearPendingDonation();
      setNotice(null);
      return;
    }

    try {
      const response = await fetch(`/api/donations/${encodeURIComponent(pending.id)}/status`, { cache: "no-store" });
      if (response.status === 404) {
        clearPendingDonation();
        setNotice(null);
        return;
      }
      const data = (await response.json()) as { status?: string };
      if (data.status === "PAID") {
        clearPendingDonation();
        setNotice({ kind: "paid", donation: pending });
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        clearPendingDonation();
        setNotice({ kind: "failed", donation: pending });
      } else {
        setNotice({ kind: "pending", donation: pending });
      }
    } catch {
      // Ag hatasinda sessiz kalinir; bir sonraki kontrolde tekrar denenir.
    }
  }, [failureShownOnPage, onReceipt, pathname]);

  useEffect(() => {
    if (hidden) return;
    polls.current = 0;
    void check();

    function onPageShow() {
      void check();
    }
    function onVisible() {
      if (document.visibilityState === "visible") void check();
    }
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check, hidden]);

  // Banka onayi gec gelebilir: "bekliyor" durumunda bir sure daha kontrol edilir.
  useEffect(() => {
    if (notice?.kind !== "pending" || polls.current >= MAX_POLLS) return;
    const timer = window.setTimeout(() => {
      polls.current += 1;
      if (document.visibilityState === "visible") void check();
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [notice, check]);

  if (hidden || !notice) return null;

  const { donation } = notice;
  const retryHref = `/bagis?type=${encodeURIComponent(donation.typeCode)}&amount=${encodeURIComponent(donation.amount)}`;
  const amountLabel = `${Number(donation.amount).toLocaleString("tr-TR")} ₺`;
  const dismiss = () => {
    clearPendingDonation();
    setNotice(null);
  };

  const styles = {
    paid: { box: "border-green-200 bg-white", bar: "bg-[#3f7d17]", icon: <CheckCircle2 className="text-[#3f7d17]" size={26} /> },
    failed: { box: "border-red-200 bg-white", bar: "bg-red-600", icon: <XCircle className="text-red-600" size={26} /> },
    pending: { box: "border-amber-300 bg-white", bar: "bg-amber-500", icon: <AlertTriangle className="text-amber-600" size={26} /> }
  }[notice.kind];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[150] p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-[440px] sm:p-0" role={notice.kind === "paid" ? "status" : "alert"}>
      <div className={`overflow-hidden rounded-2xl border shadow-[0_24px_60px_rgba(10,58,85,0.25)] ${styles.box}`}>
        <div className={`h-1.5 ${styles.bar}`} />
        <div className="flex gap-3 p-4 sm:p-5">
          <span className="shrink-0">{styles.icon}</span>
          <div className="min-w-0 flex-1">
            {notice.kind === "paid" && (
              <>
                <p className="font-black text-hayat-dark">Bağışınız başarıyla alındı</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#52646d]">{donation.typeLabel} · {amountLabel}. Desteğiniz için teşekkür ederiz.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/bagis/makbuz/${donation.id}`} onClick={() => setNotice(null)} className="inline-flex h-10 items-center rounded-xl bg-[#3f7d17] px-4 text-sm font-black text-white">Makbuzu Görüntüle</Link>
                </div>
              </>
            )}
            {notice.kind === "failed" && (
              <>
                <p className="font-black text-hayat-dark">Son bağış işleminiz tamamlanmadı</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#52646d]">{donation.typeLabel} · {amountLabel} için <strong>ödeme alınmadı</strong>. Dilerseniz tekrar deneyebilirsiniz.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={retryHref} onClick={() => setNotice(null)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-hayat-dark px-4 text-sm font-black text-white"><RotateCcw size={15} /> Tekrar Bağış Yap</Link>
                </div>
              </>
            )}
            {notice.kind === "pending" && (
              <>
                <p className="font-black text-hayat-dark">Bağışınız henüz tamamlanmadı</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#52646d]">
                  {donation.typeLabel} · {amountLabel} için bankadan onay gelmedi. Banka sayfasında kart bilgilerini ve <strong>SMS onayını tamamlamadıysanız ödemeniz alınmamıştır.</strong>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={retryHref} onClick={dismiss} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#3f7d17] px-4 text-sm font-black text-white"><RotateCcw size={15} /> Ödemeyi Tekrar Başlat</Link>
                  <Link href="/hesap-numaralarimiz" onClick={dismiss} className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-black text-hayat-dark">Havale ile Bağış</Link>
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={dismiss} aria-label="Bildirimi kapat" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
