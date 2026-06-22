import { FolderHeart } from "lucide-react";
import { SectionIndexPage } from "@/components/SectionIndexPage";

export const revalidate = 60;

export default function ProjectsPage() {
  return (
    <SectionIndexPage
      type="CAMPAIGN"
      eyebrow="Projeler"
      title="Projeler ve kampanyalar"
      description="Devam eden bağış projeleri, kampanyalar ve destek çağrılarını bu sayfadan takip edebilirsiniz."
      countLabel="proje"
      itemLabel="Proje"
      emptyTitle="Henüz proje eklenmemiş"
      emptyBody="Admin panelinden CAMPAIGN türünde içerik eklediğinizde bu sayfada görünecek."
      backHref="/#kampanyalar"
      Icon={FolderHeart}
    />
  );
}


