"use server";

import { prisma } from "@/lib/prisma";
import { ensureDefaultDonationTypes } from "@/lib/donation-types";
import { ensureManagedSectionsOnce, fallbackSections } from "@/lib/site-content";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile, unlink } from "fs/promises";
import { sendSms } from "@/lib/sms";
import path from "path";
import { createHash } from "crypto";

type AnnouncementType = string;
type ApplicationStatus = string;
type SectionLayout = string;
type SectionTheme = string;
type SectionType = string;

const uploadDir = path.join(process.cwd(), "public", "uploads");

function revalidateDonationTypes() {
  revalidateTag("donation-types");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/bagis");
  revalidatePath("/admin");
}

function revalidateSiteContent() {
  revalidateTag("site-content");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function rawTextValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableTextValue(formData: FormData, key: string) {
  const value = rawTextValue(formData, key);
  return value ? value : null;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = textValue(formData, key);
  const parsed = value ? Number(value) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function codeValue(formData: FormData, key: string) {
  const value = rawTextValue(formData, key)
    .toLocaleUpperCase("tr-TR")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/İ/g, "I")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return value;
}

function passwordHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value?: string) {
  return value?.trim().toLocaleLowerCase("tr-TR");
}

function normalizeUsername(value?: string) {
  return value
    ?.trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, "");
}

function revalidateAdminUsers() {
  revalidatePath("/admin");
  revalidatePath("/admin?sayfa=kullanicilar");
}


function dateValue(formData: FormData, key: string) {
  const value = textValue(formData, key);
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function announcementPayload(formData: FormData) {
  return {
    title: textValue(formData, "title") || "Yeni duyuru",
    content: textValue(formData, "content") || "",
    type: (textValue(formData, "type") || "GENEL") as AnnouncementType,
    isActive: formData.get("isActive") === "on",
    isPinned: formData.get("isPinned") === "on",
    startDate: dateValue(formData, "startDate"),
    endDate: dateValue(formData, "endDate"),
    sortOrder: numberValue(formData, "sortOrder")
  };
}


function popupPayload(formData: FormData) {
  return {
    title: textValue(formData, "title") || "Yeni duyuru",
    content: textValue(formData, "content") || "",
    imageUrl: textValue(formData, "imageUrl"),
    imageAlt: textValue(formData, "imageAlt"),
    buttonLabel: textValue(formData, "buttonLabel"),
    buttonUrl: textValue(formData, "buttonUrl"),
    isActive: formData.get("isActive") === "on",
    showOnce: formData.get("showOnce") === "on",
    delaySeconds: numberValue(formData, "delaySeconds", 1)
  };
}

function sectionPayload(formData: FormData) {
  // Önemli: Kullanıcı bir alanı panelden boşaltınca eski sabit/varsayılan metin geri gelmemeli.
  // Bu yüzden opsiyonel metinler boş bırakıldığında `null` olarak kaydedilir.
  // Başlık zorunlu alan olduğu için boş string kaydedilir ve ana sayfada boşsa hiç basılmaz.
  return {
    title: rawTextValue(formData, "title"),
    subtitle: nullableTextValue(formData, "subtitle"),
    body: nullableTextValue(formData, "body"),
    badge: nullableTextValue(formData, "badge"),
    imageUrl: nullableTextValue(formData, "imageUrl"),
    imageAlt: nullableTextValue(formData, "imageAlt"),
    href: nullableTextValue(formData, "href"),
    buttonLabel: nullableTextValue(formData, "buttonLabel"),
    secondaryHref: nullableTextValue(formData, "secondaryHref"),
    secondaryButtonLabel: nullableTextValue(formData, "secondaryButtonLabel"),
    type: (textValue(formData, "type") || "CUSTOM") as SectionType,
    layout: (textValue(formData, "layout") || "CARD") as SectionLayout,
    theme: (textValue(formData, "theme") || "LIGHT") as SectionTheme,
    sortOrder: numberValue(formData, "sortOrder"),
    titleSize: numberValue(formData, "titleSize", 32),
    subtitleSize: numberValue(formData, "subtitleSize", 14),
    bodySize: numberValue(formData, "bodySize", 16),
    titleColor: nullableTextValue(formData, "titleColor"),
    subtitleColor: nullableTextValue(formData, "subtitleColor"),
    bodyColor: nullableTextValue(formData, "bodyColor"),
    textAlign: textValue(formData, "textAlign") || "left",
    contentWidth: textValue(formData, "contentWidth") || "normal",
    paddingY: numberValue(formData, "paddingY", 56),
    cardWidth: textValue(formData, "cardWidth") || "normal",
    minHeight: textValue(formData, "minHeight") ? numberValue(formData, "minHeight", 0) : null,
    cardPadding: numberValue(formData, "cardPadding", 32),
    marginTop: numberValue(formData, "marginTop", 0),
    marginBottom: numberValue(formData, "marginBottom", 0),
    borderRadius: numberValue(formData, "borderRadius", 32),
    borderColor: nullableTextValue(formData, "borderColor"),
    backgroundColor: nullableTextValue(formData, "backgroundColor"),
    customTitle: nullableTextValue(formData, "customTitle"),
    isActive: formData.get("isActive") === "on"
  };
}

async function saveUploadedSectionImage(sectionId: string, file: File, sortOrder: number) {
  if ((!file.type.startsWith("image/") && !file.type.startsWith("video/")) || file.size === 0) return;
  if (file.size > 80 * 1024 * 1024) return;

  await mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const filename = `${Date.now()}-${sectionId.slice(0, 6)}-${safeName}`;
  const diskPath = path.join(uploadDir, filename);
  await writeFile(diskPath, bytes);

  await prisma.siteSectionImage.create({
    data: {
      sectionId,
      url: `/uploads/${filename}`,
      alt: file.name,
      sortOrder
    }
  });
}

async function syncSectionImages(sectionId: string, formData: FormData) {
  const imageIds = formData.getAll("sectionImageId").filter((value): value is string => typeof value === "string");
  const imageUrls = formData.getAll("sectionImageUrl").map((value) => (typeof value === "string" ? value.trim() : ""));
  const imageAlts = formData.getAll("sectionImageAlt").map((value) => (typeof value === "string" ? value.trim() : ""));
  const imageOrders = formData.getAll("sectionImageSortOrder").map((value) => (typeof value === "string" ? Number(value) : 0));
  const deleteIds = new Set(formData.getAll("sectionImageDeleteId").filter((value): value is string => typeof value === "string"));

  for (let index = 0; index < imageIds.length; index += 1) {
    const id = imageIds[index];
    if (!id) continue;

    if (deleteIds.has(id)) {
      await prisma.siteSectionImage.delete({ where: { id } }).catch(() => null);
      continue;
    }

    const url = imageUrls[index];
    if (!url) {
      await prisma.siteSectionImage.delete({ where: { id } }).catch(() => null);
      continue;
    }

    await prisma.siteSectionImage.update({
      where: { id },
      data: {
        url,
        alt: imageAlts[index] || null,
        sortOrder: Number.isFinite(imageOrders[index]) ? imageOrders[index] : index
      }
    }).catch(() => null);
  }

  const newUrls = formData.getAll("newSectionImageUrl").map((value) => (typeof value === "string" ? value.trim() : ""));
  const newAlts = formData.getAll("newSectionImageAlt").map((value) => (typeof value === "string" ? value.trim() : ""));
  const newOrders = formData.getAll("newSectionImageSortOrder").map((value) => (typeof value === "string" ? Number(value) : 0));

  for (let index = 0; index < newUrls.length; index += 1) {
    const url = newUrls[index];
    if (!url) continue;

    await prisma.siteSectionImage.create({
      data: {
        sectionId,
        url,
        alt: newAlts[index] || null,
        sortOrder: Number.isFinite(newOrders[index]) ? newOrders[index] : index + 100
      }
    });
  }

  const uploadedFiles = formData.getAll("newSectionImageFiles").filter((value): value is File => value instanceof File && value.size > 0);
  const currentCount = await prisma.siteSectionImage.count({ where: { sectionId } });
  for (let index = 0; index < uploadedFiles.length; index += 1) {
    await saveUploadedSectionImage(sectionId, uploadedFiles[index], currentCount + index + 1);
  }
}

function redirectToSectionTab(formData: FormData) {
  const type = textValue(formData, "type") || "HERO";
  redirect(`/admin?sayfa=anasayfa&alan=${encodeURIComponent(type)}#anasayfa-alanlari`);
}

export async function seedDefaultSections() {
  // Varsayılan alanları yalnızca ilk kurulumda, veritabanında hiç alan yoksa ekle.
  // Böylece kullanıcı panelden sildiği/pasif yaptığı alanları yanlışlıkla tekrar geri getirmez.
  const count = await prisma.siteSection.count();
  if (count > 0) {
    revalidateSiteContent();
    redirect("/admin");
  }

  for (const section of fallbackSections) {
    await prisma.siteSection.create({
      data: {
        id: section.id,
        title: section.title,
        subtitle: section.subtitle,
        body: section.body,
        badge: section.badge,
        imageUrl: section.imageUrl,
        imageAlt: section.imageAlt,
        href: section.href,
        buttonLabel: section.buttonLabel,
        secondaryHref: section.secondaryHref,
        secondaryButtonLabel: section.secondaryButtonLabel,
        type: section.type,
        layout: section.layout,
        theme: section.theme,
        sortOrder: section.sortOrder,
        isActive: true
      }
    });
  }
  revalidateSiteContent();
  redirect("/admin");
}

const managedHomepageSections = [
  {
    type: "HERO",
    title: "Ana Karşılama",
    customTitle: "Ana Karşılama",
    badge: "Hayat Ağacı Derneği",
    body: "Hayat Ağacı Derneği olarak bağışlarınızı kayıtlı, şeffaf ve takip edilebilir süreçlerle ihtiyaç sahiplerine ulaştırıyoruz.",
    buttonLabel: "Bağış Yap",
    href: "/bagis",
    secondaryButtonLabel: "Projeleri İncele",
    secondaryHref: "/#projeler",
    layout: "SPLIT",
    theme: "SOFT",
    sortOrder: 1
  },
  {
    type: "FEATURE",
    title: "Hızlı Bağış Alanı",
    customTitle: "Hızlı Bağış",
    subtitle: "Desteğinizi hemen ulaştırın",
    body: "Bağış kategorisi ve tutarınızı seçerek güvenli bağış ekranına geçebilirsiniz.",
    buttonLabel: "Şimdi Destek Ol",
    href: "/bagis",
    layout: "BANNER",
    theme: "GREEN",
    sortOrder: 2
  },
  {
    type: "FEATURE",
    title: "Genel Bağış Kısayolu",
    customTitle: "Bağış Kısayolları",
    body: "Genel Bağış",
    href: "/bagis",
    layout: "CARD",
    theme: "LIGHT",
    sortOrder: 3
  },
  {
    type: "FEATURE",
    title: "Acil Yardım Kısayolu",
    customTitle: "Bağış Kısayolları",
    body: "Acil Yardım",
    href: "/bagis",
    layout: "CARD",
    theme: "LIGHT",
    sortOrder: 4
  },
  {
    type: "FEATURE",
    title: "Gıda Paketi Kısayolu",
    customTitle: "Bağış Kısayolları",
    body: "Gıda Paketi",
    href: "/bagis",
    layout: "CARD",
    theme: "LIGHT",
    sortOrder: 5
  },
  {
    type: "FEATURE",
    title: "Su Kuyusu Kısayolu",
    customTitle: "Bağış Kısayolları",
    body: "Su Kuyusu",
    href: "/bagis",
    layout: "CARD",
    theme: "LIGHT",
    sortOrder: 6
  },
  {
    type: "FEATURE",
    title: "Kurban Kısayolu",
    customTitle: "Bağış Kısayolları",
    body: "Kurban",
    href: "/kurban",
    layout: "CARD",
    theme: "LIGHT",
    sortOrder: 7
  },
  {
    type: "CUSTOM",
    title: "Ana Sayfa İstatistikleri",
    customTitle: "Bugüne Kadar",
    body: "12.450+|Ulaşılan aile\n7/24|Online bağış\n%100|Kayıtlı süreç\nGüvenli|Başvuru takibi",
    layout: "BANNER",
    theme: "GREEN",
    sortOrder: 90
  }
] as const;

export async function ensureHomepageManagedSections() {
  await ensureManagedSectionsOnce();

  revalidateSiteContent();
  redirect("/admin?sayfa=anasayfa");
}


export async function savePopupSetting(formData: FormData) {
  const id = textValue(formData, "id");
  const data = popupPayload(formData);
  if (id) {
    await prisma.popupSetting.update({ where: { id }, data });
  } else {
    await prisma.popupSetting.create({ data });
  }
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?sayfa=popup#popup-ayarlari");
}

export async function saveStatsSection(formData: FormData) {
  const id = textValue(formData, "id");
  const title = textValue(formData, "title") || "Desteklerinizle büyüyen iyilik ağı";
  const badge = textValue(formData, "badge") || "Bugüne Kadar";
  const backgroundColor = textValue(formData, "backgroundColor") || "#6FB744";
  const statValues = formData.getAll("statValue").map((value) => (typeof value === "string" ? value.trim() : ""));
  const statLabels = formData.getAll("statLabel").map((value) => (typeof value === "string" ? value.trim() : ""));
  const statLines = statValues
    .map((value, index) => {
      const label = statLabels[index];
      return value && label ? `${value}|${label}` : null;
    })
    .filter((line): line is string => Boolean(line));

  const data = {
    type: "CUSTOM",
    title,
    customTitle: "Bugüne Kadar",
    badge,
    body: statLines.join("\n"),
    layout: "BANNER",
    theme: "GREEN",
    sortOrder: 90,
    titleColor: "#ffffff",
    subtitleColor: "rgba(255,255,255,.75)",
    backgroundColor,
    isActive: true
  };

  if (id) {
    await prisma.siteSection.update({ where: { id }, data });
  } else {
    await prisma.siteSection.create({ data });
  }

  revalidateSiteContent();
  redirect("/admin?sayfa=istatistik#bugune-kadar");
}

export async function createSection(formData: FormData) {
  const section = await prisma.siteSection.create({ data: sectionPayload(formData) });
  await syncSectionImages(section.id, formData);
  revalidateSiteContent();
  redirectToSectionTab(formData);
}

export async function updateSection(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;
  await prisma.siteSection.update({ where: { id }, data: sectionPayload(formData) });
  await syncSectionImages(id, formData);
  revalidateSiteContent();
  redirectToSectionTab(formData);
}

export async function deleteSection(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;
  await prisma.siteSection.delete({ where: { id } });
  revalidateSiteContent();
  redirectToSectionTab(formData);
}

export async function duplicateSection(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;
  const section = await prisma.siteSection.findUnique({ where: { id } });
  if (!section) return;
  const images = await prisma.siteSectionImage.findMany({ where: { sectionId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  await prisma.siteSection.create({
    data: {
      title: `${section.title} - Kopya`,
      subtitle: section.subtitle,
      body: section.body,
      badge: section.badge,
      imageUrl: section.imageUrl,
      imageAlt: section.imageAlt,
      href: section.href,
      buttonLabel: section.buttonLabel,
      secondaryHref: section.secondaryHref,
      secondaryButtonLabel: section.secondaryButtonLabel,
      type: section.type,
      layout: section.layout,
      theme: section.theme,
      sortOrder: section.sortOrder + 1,
      titleSize: section.titleSize,
      subtitleSize: section.subtitleSize,
      bodySize: section.bodySize,
      titleColor: section.titleColor,
      subtitleColor: section.subtitleColor,
      bodyColor: section.bodyColor,
      textAlign: section.textAlign,
      contentWidth: section.contentWidth,
      paddingY: section.paddingY,
      cardWidth: section.cardWidth,
      minHeight: section.minHeight,
      cardPadding: section.cardPadding,
      marginTop: section.marginTop,
      marginBottom: section.marginBottom,
      borderRadius: section.borderRadius,
      borderColor: section.borderColor,
      backgroundColor: section.backgroundColor,
      customTitle: section.customTitle,
      isActive: false,
      images: {
        create: images.map((image) => ({
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder
        }))
      }
    }
  });
  revalidateSiteContent();
  redirectToSectionTab(formData);
}

export async function uploadMedia(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
  if (file.size > 80 * 1024 * 1024) return;

  await mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const filename = `${Date.now()}-${safeName}`;
  const diskPath = path.join(uploadDir, filename);
  await writeFile(diskPath, bytes);
  await prisma.mediaAsset.create({
    data: {
      title: textValue(formData, "title"),
      url: `/uploads/${filename}`,
      filename,
      mimeType: file.type,
      size: file.size
    }
  });
  revalidatePath("/admin");
  redirect("/admin?sayfa=medya#medya");
}

export async function deleteMedia(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media) return;
  await prisma.mediaAsset.delete({ where: { id } });
  try {
    await unlink(path.join(process.cwd(), "public", media.url));
  } catch {}
  revalidatePath("/admin");
  redirect("/admin?sayfa=medya#medya");
}

export async function updateApplicationStatus(formData: FormData) {
  const id = textValue(formData, "id");
  const status = textValue(formData, "status");
  const adminNote = textValue(formData, "adminNote");
  const trackingNote = textValue(formData, "trackingNote");
  const sendStatusSms = formData.get("sendStatusSms") === "on";
  if (!id || !status) return;
  const app = await prisma.aidApplication.update({
    where: { id },
    data: { status: status as ApplicationStatus, adminNote, trackingNote }
  });
  if (sendStatusSms) {
    const message = `Hayat Agaci basvurunuz guncellendi. Basvuru No: ${app.applicationNo || app.id} Durum: ${status}`;
    const sms = await sendSms(app.phone, message);
    await prisma.smsLog.create({ data: { applicationId: app.id, phone: app.phone, message: sms.message, provider: sms.provider, status: sms.status } });
  }
  revalidatePath("/admin/basvurular");
  revalidatePath("/basvuru-takip");
  revalidatePath("/admin");
}

export async function deleteApplication(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;
  await prisma.aidApplication.delete({ where: { id } });
  revalidatePath("/admin/basvurular");
  revalidatePath("/admin");
}

export async function seedDefaultPolicies() {
  const defaults = [
    { type: "KVKK", slug: "kvkk", title: "KVKK Aydınlatma Metni", content: "Bu alan yönetim panelinden kurumunuzun resmi KVKK Aydınlatma Metni ile güncellenmelidir. Bağışçı ve başvuru sahibi kişisel verileri, ilgili mevzuat kapsamında yalnızca dernek faaliyetlerinin yürütülmesi amacıyla işlenir." },
    { type: "TERMS_PRIVACY", slug: "kullanim-kosullari-ve-gizlilik-politikasi", title: "Kullanım Koşulları ve Gizlilik Politikası", content: "Bu alan yönetim panelinden kurumunuzun resmi kullanım koşulları ve gizlilik politikası ile güncellenmelidir. Site kullanımı, bağış işlemleri ve kişisel veri güvenliği esasları burada açıklanır." },
    { type: "REFUND", slug: "iade-politikasi", title: "İade Politikası", content: "Bu alan yönetim panelinden kurumunuzun resmi iade politikası ile güncellenmelidir. Hatalı veya mükerrer bağış talepleri kurum incelemesi sonrasında değerlendirilir." },
    { type: "COOKIE", slug: "cerez-politikasi", title: "Çerez Politikası", content: "Bu alan yönetim panelinden kurumunuzun resmi çerez politikası ile güncellenmelidir. Site deneyimini iyileştirmek ve güvenliği sağlamak amacıyla zorunlu çerezler kullanılabilir." }
  ] as const;
  for (const item of defaults) {
    await prisma.policyPage.upsert({
      where: { type: item.type },
      create: item,
      update: {}
    });
  }
  revalidatePath("/admin/politikalar");
  revalidatePath("/");
  redirect("/admin/politikalar");
}

export async function updatePolicyPage(formData: FormData) {
  const id = textValue(formData, "id");
  const title = textValue(formData, "title") || "Başlıksız Sayfa";
  const content = textValue(formData, "content") || "";
  const isActive = formData.get("isActive") === "on";
  if (!id) return;
  const policy = await prisma.policyPage.update({ where: { id }, data: { title, content, isActive } });
  revalidatePath("/admin/politikalar");
  revalidatePath(`/${policy.slug}`);
}

export async function seedDefaultAnnouncements() {
  const count = await prisma.announcement.count();
  if (count === 0) {
    await prisma.announcement.createMany({
      data: [
        { title: "Kurban bağışı kayıtları başladı", content: "Kurban organizasyonu için online başvuru ve bağış ekranlarımız aktif hale getirilmiştir.", type: "KAMPANYA", isActive: true, isPinned: true, sortOrder: 1 },
        { title: "Online yardım başvurusu alınmaktadır", content: "İhtiyaç sahibi vatandaşlarımız web sitemiz üzerinden yardım başvurusu yapabilir ve başvurusunu takip edebilir.", type: "GENEL", isActive: true, isPinned: false, sortOrder: 2 },
        { title: "Bağış işlemlerinde KVKK onayları eklendi", content: "Online bağış formunda KVKK, gizlilik ve iade politikası onayları kayıt altına alınmaktadır.", type: "HABER", isActive: true, isPinned: false, sortOrder: 3 }
      ]
    });
  }
  revalidatePath("/");
  revalidatePath("/admin/duyurular");
  redirect("/admin/duyurular");
}

export async function createAnnouncement(formData: FormData) {
  await prisma.announcement.create({ data: announcementPayload(formData) });
  revalidatePath("/");
  revalidatePath("/admin/duyurular");
  redirect("/admin/duyurular");
}

export async function updateAnnouncement(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;
  await prisma.announcement.update({ where: { id }, data: announcementPayload(formData) });
  revalidatePath("/");
  revalidatePath("/admin/duyurular");
}

export async function deleteAnnouncement(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/duyurular");
}

export async function saveGroupLabel(formData: FormData) {
  const type = textValue(formData, "type");
  const label = textValue(formData, "label");
  if (!type || !label) return;
  
  await prisma.sectionGroupLabel.upsert({
    where: { type },
    update: { label },
    create: { type, label }
  });

  revalidateSiteContent();
}

export async function saveGroupLabels(formData: FormData) {
  const types = formData.getAll("type").filter((value): value is string => typeof value === "string");
  const labels = formData.getAll("label").map((value) => (typeof value === "string" ? value.trim() : ""));

  for (let index = 0; index < types.length; index += 1) {
    const type = types[index];
    const label = labels[index];
    if (!type || !label) continue;

    await prisma.sectionGroupLabel.upsert({
      where: { type },
      update: { label },
      create: { type, label }
    });
  }

  revalidateSiteContent();
}

export async function createDonationType(formData: FormData) {
  let code = codeValue(formData, "code");
  const label = textValue(formData, "label");
  if (!code && label) {
    const labelData = new FormData();
    labelData.set("code", label);
    code = codeValue(labelData, "code");
  }
  if (!code || !label) return;

  await prisma.donationType.upsert({
    where: { code },
    create: {
      code,
      label,
      description: nullableTextValue(formData, "description"),
      sortOrder: numberValue(formData, "sortOrder", 50),
      isActive: formData.get("isActive") === "on"
    },
    update: {
      label,
      description: nullableTextValue(formData, "description"),
      sortOrder: numberValue(formData, "sortOrder", 50),
      isActive: formData.get("isActive") === "on"
    }
  });

  revalidateDonationTypes();
  redirect("/admin?sayfa=bagis#bagis-turleri");
}

export async function updateDonationType(formData: FormData) {
  const id = textValue(formData, "id");
  const code = codeValue(formData, "code");
  const label = textValue(formData, "label");
  if (!id || !code || !label) return;

  await prisma.donationType.update({
    where: { id },
    data: {
      code,
      label,
      description: nullableTextValue(formData, "description"),
      sortOrder: numberValue(formData, "sortOrder", 50),
      isActive: formData.get("isActive") === "on"
    }
  });

  revalidateDonationTypes();
  redirect("/admin?sayfa=bagis#bagis-turleri");
}

export async function updateDonationTypesBulk(formData: FormData) {
  const ids = formData.getAll("id").filter((value): value is string => typeof value === "string");
  const codes = formData.getAll("code").map((value) => (typeof value === "string" ? value : ""));
  const labels = formData.getAll("label").map((value) => (typeof value === "string" ? value.trim() : ""));
  const descriptions = formData.getAll("description").map((value) => (typeof value === "string" ? value.trim() : ""));
  const sortOrders = formData.getAll("sortOrder").map((value) => (typeof value === "string" ? Number(value) : 50));
  const activeIds = new Set(formData.getAll("isActive").filter((value): value is string => typeof value === "string"));
  const deleteIds = new Set(formData.getAll("deleteId").filter((value): value is string => typeof value === "string"));

  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    if (!id) continue;

    if (deleteIds.has(id)) {
      await prisma.donationType.delete({ where: { id } }).catch(() => null);
      continue;
    }

    let code = codes[index]
      ?.toLocaleUpperCase("tr-TR")
      .replace(/Ğ/g, "G")
      .replace(/Ü/g, "U")
      .replace(/Ş/g, "S")
      .replace(/İ/g, "I")
      .replace(/Ö/g, "O")
      .replace(/Ç/g, "C")
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const label = labels[index];
    if (!code && label) {
      code = label
        .toLocaleUpperCase("tr-TR")
        .replace(/Ğ/g, "G")
        .replace(/Ü/g, "U")
        .replace(/Ş/g, "S")
        .replace(/İ/g, "I")
        .replace(/Ö/g, "O")
        .replace(/Ç/g, "C")
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    }
    if (!code || !label) continue;

    await prisma.donationType.update({
      where: { id },
      data: {
        code,
        label,
        description: descriptions[index] || null,
        sortOrder: Number.isFinite(sortOrders[index]) ? sortOrders[index] : 50,
        isActive: activeIds.has(id)
      }
    }).catch(() => null);
  }

  revalidateDonationTypes();
  redirect("/admin?sayfa=bagis#bagis-turleri");
}

export async function deleteDonationType(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;

  await prisma.donationType.delete({ where: { id } });

  revalidateDonationTypes();
  redirect("/admin?sayfa=bagis#bagis-turleri");
}

export async function seedDonationTypes() {
  await ensureDefaultDonationTypes();
  revalidateDonationTypes();
  redirect("/admin?sayfa=bagis#bagis-turleri");
}

export async function createAdminUser(formData: FormData) {
  const fullName = textValue(formData, "fullName") || "Yeni kullanıcı";
  const username = normalizeUsername(textValue(formData, "username"));
  const email = normalizeEmail(textValue(formData, "email"));
  const password = textValue(formData, "password");
  const role = textValue(formData, "role") || "EDITOR";

  if (!username || !email || !password) return;

  await prisma.adminUser.create({
    data: {
      fullName,
      username,
      email,
      role,
      passwordHash: passwordHash(password),
      isActive: formData.get("isActive") === "on"
    }
  }).catch(() => null);

  revalidateAdminUsers();
  redirect("/admin?sayfa=kullanicilar#admin-kullanicilar");
}

export async function updateAdminUser(formData: FormData) {
  const id = textValue(formData, "id");
  const fullName = textValue(formData, "fullName") || "Kullanıcı";
  const username = normalizeUsername(textValue(formData, "username"));
  const email = normalizeEmail(textValue(formData, "email"));
  const role = textValue(formData, "role") || "EDITOR";
  const password = textValue(formData, "password");
  const activeValue = formData.get("isActive");

  if (!id || !username || !email) return;

  await prisma.adminUser.update({
    where: { id },
    data: {
      fullName,
      username,
      email,
      role,
      ...(activeValue === "on" ? { isActive: true } : {}),
      ...(activeValue === "off" ? { isActive: false } : {}),
      ...(password ? { passwordHash: passwordHash(password) } : {})
    }
  }).catch(() => null);

  revalidateAdminUsers();
  redirect("/admin?sayfa=kullanicilar#admin-kullanicilar");
}

export async function deleteAdminUser(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;

  await prisma.adminUser.delete({ where: { id } }).catch(() => null);

  revalidateAdminUsers();
  redirect("/admin?sayfa=kullanicilar#admin-kullanicilar");
}

