import { Newspaper } from "lucide-react";
import { SectionIndexPage } from "@/components/SectionIndexPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function NewsPage() {
  return (
    <SectionIndexPage
      type="NEWS"
      eyebrow="Haberler"
      title="Güncel haberler ve duyurular"
      description="Dernek faaliyetleri, duyurular ve sahadan güncel gelişmeler burada düzenli olarak yayınlanır."
      countLabel="haber"
      itemLabel="Haber"
      emptyTitle="Henüz haber eklenmemiş"
      emptyBody="Admin panelinden NEWS türünde içerik eklediğinizde bu sayfada görünecek."
      backHref="/#haberler"
      Icon={Newspaper}
    />
  );
}


