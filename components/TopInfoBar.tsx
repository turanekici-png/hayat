"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Phone, ShieldCheck } from "lucide-react";
import { usePublicSiteSettings } from "@/components/SiteSettingsProvider";

type TopInfoBarProps = {
  affiliationNote: string | null;
  registryNo: string | null;
  phone: string | null;
  phoneHref?: string;
};

/** Tum genel sayfalarin en ustundeki ince kurumsal bilgi seridi (admin panelinde gizli). */
export function TopInfoBar({ affiliationNote, registryNo, phone, phoneHref }: TopInfoBarProps) {
  const pathname = usePathname() || "/";
  const { applicationsEnabled, applicationHref, applicationIsExternal } = usePublicSiteSettings();
  if (pathname.startsWith("/admin")) return null;
  if (!affiliationNote && !registryNo && !phone) return null;

  return (
    <div className="bg-hayat-dark text-[12.5px] font-semibold text-[#dbe9f1]">
      <div className="mx-auto flex max-w-[1840px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1">
          {affiliationNote && (
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} aria-hidden="true" /> {affiliationNote}
            </span>
          )}
          {registryNo && <span className="hidden sm:inline">Dernek Kütük No: {registryNo}</span>}
        </div>
        <div className="flex items-center gap-5">
          {phone && (
            <a href={phoneHref} className="inline-flex items-center gap-1.5 hover:text-white">
              <Phone size={13} aria-hidden="true" /> {phone}
            </a>
          )}
          {applicationsEnabled && (
            <a
              href={applicationHref}
              {...(applicationIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex items-center gap-1.5 rounded-full bg-hayat-green px-3 py-1 font-black text-white transition hover:bg-white hover:text-hayat-dark"
            >
              <ClipboardList size={13} aria-hidden="true" /> Online yardım başvurusu açık
            </a>
          )}
          <Link href="/basvuru-takip" className="hidden hover:text-white sm:inline">Başvuru Takibi</Link>
        </div>
      </div>
    </div>
  );
}
