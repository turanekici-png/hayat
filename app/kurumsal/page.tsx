import { ShieldCheck } from "lucide-react";
import { SectionIndexPage, isCorporateSection } from "@/components/SectionIndexPage";

export const revalidate = 60;

export default function CorporatePage() {
  return (
    <SectionIndexPage
      groupLabelType="ABOUT"
      filter={isCorporateSection}
      eyebrow="Kurumsal"
      title="Kurumsal bilgiler"
      description="Hayat Ağacı Derneği'nin kurumsal yapısı, misyonu, vizyonu ve çalışma ilkeleri bu sayfada yer alır."
      countLabel="içerik"
      itemLabel="Kurumsal"
      emptyTitle="Henüz kurumsal içerik eklenmemiş"
      emptyBody="Admin panelinden ABOUT türünde içerik eklediğinizde bu sayfada görünecek."
      backHref="/#kurumsal"
      Icon={ShieldCheck}
    />
  );
}


