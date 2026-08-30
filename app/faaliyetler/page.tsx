import { HeartHandshake } from "lucide-react";
import { SectionIndexPage } from "@/components/SectionIndexPage";

export const revalidate = 60; // ISR: Cloudflare/CDN'de önbelleklenebilir olsun diye force-dynamic kaldırıldı

export default function ActivitiesPage() {
  return (
    <SectionIndexPage
      type="ACTIVITY"
      eyebrow="Faaliyetler"
      title="Yardım faaliyetleri"
      description="Gıda, eğitim, giyim, nakdi destek ve sahadaki diğer yardım faaliyetlerini tek yerde inceleyebilirsiniz."
      countLabel="faaliyet"
      itemLabel="Faaliyet"
      emptyTitle="Henüz faaliyet eklenmemiş"
      emptyBody="Admin panelinden ACTIVITY türünde içerik eklediğinizde bu sayfada görünecek."
      backHref="/#faaliyetler"
      Icon={HeartHandshake}
    />
  );
}


