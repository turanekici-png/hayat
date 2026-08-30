"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordVisit } from "@/app/visit-actions";

/**
 * Admin paneli disindaki her sayfada bir kez calisir. Ayni tarayicidan gunde
 * bir kez sayilir (localStorage), boylece sayfa yenileme/gezinme sayaci
 * sismez; kabaca gunluk "kac kisi ziyaret etti" rakamini verir.
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    try {
      const today = new Date().toISOString().slice(0, 10);
      const key = `hayatder-visited-${today}`;
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
      void recordVisit(pathname);
    } catch {
      // localStorage kullanılamıyorsa (gizli sekme/tarayıcı kısıtlaması) sessizce atlanır.
    }
  }, [pathname]);

  return null;
}
