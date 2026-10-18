import { NextResponse } from "next/server";
import { z } from "zod";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { publicPath } from "@/lib/public-files";
import { areApplicationsOpen } from "@/lib/site-settings";

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().nonnegative().optional()
);

const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().int().positive().optional()
);

const applicationSchema = z.object({
  fullName: z.string().min(3, "Ad soyad zorunludur."),
  nationalId: z.string().optional().nullable(),
  phone: z.string().min(10, "Telefon zorunludur."),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  householdCount: optionalPositiveInt,
  monthlyIncome: optionalNumber,
  employment: z.string().optional().nullable(),
  vehicleInfo: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  aidType: z.enum(["GIDA", "NAKIT", "GIYIM", "EGITIM", "SAGLIK", "BARINMA", "DIGER"]),
  description: z.string().min(10, "Başvuru açıklaması en az 10 karakter olmalıdır.")
});

function emptyToNull(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

// Numara, kayit sayisina gore degil yilin en buyuk numarasina gore uretilir; aradan
// basvuru silinse bile yeni numara mevcut bir numarayla cakismaz.
async function nextApplicationNo() {
  const year = new Date().getFullYear();
  const prefix = `HA-${year}-`;
  const last = await prisma.aidApplication.findFirst({
    where: { applicationNo: { startsWith: prefix } },
    orderBy: { applicationNo: "desc" },
    select: { applicationNo: true }
  });
  const lastNumber = Number(last?.applicationNo?.slice(prefix.length)) || 0;
  return `${prefix}${String(lastNumber + 1).padStart(6, "0")}`;
}

function isUniqueConflict(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

const uploadDir = publicPath("uploads", "basvurular");

export async function POST(request: Request) {
  // Admin basvurulari kapattiysa (Site Ayarlari) dogrudan gonderilen istekler de reddedilir.
  if (!(await areApplicationsOpen())) {
    return NextResponse.json({ ok: false, message: "Online yardım başvuruları şu an kapalıdır." }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = applicationSchema.safeParse(Object.fromEntries(form.entries()));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.errors[0]?.message || "Başvuru bilgileri eksik." }, { status: 400 });
  }

  const data = parsed.data;
  const createApplication = async () => prisma.aidApplication.create({
    data: {
      applicationNo: await nextApplicationNo(),
      fullName: data.fullName,
      nationalId: emptyToNull(data.nationalId) as string | null,
      phone: data.phone,
      email: emptyToNull(data.email) as string | null,
      city: emptyToNull(data.city) as string | null,
      district: emptyToNull(data.district) as string | null,
      address: emptyToNull(data.address) as string | null,
      householdCount: data.householdCount || null,
      monthlyIncome: data.monthlyIncome ?? null,
      employment: emptyToNull(data.employment) as string | null,
      vehicleInfo: emptyToNull(data.vehicleInfo) as string | null,
      iban: emptyToNull(data.iban) as string | null,
      aidType: data.aidType,
      description: data.description,
      trackingNote: "Başvurunuz alınmıştır. İnceleme süreci başladığında durum bilgisi bu ekrandan takip edilebilir."
    }
  });

  // Ayni anda gelen iki basvuru ayni numarayi almaya calisirsa yeniden denenir.
  let application: Awaited<ReturnType<typeof createApplication>> | null = null;
  for (let attempt = 0; attempt < 3 && !application; attempt += 1) {
    try {
      application = await createApplication();
    } catch (error) {
      if (!isUniqueConflict(error) || attempt === 2) throw error;
    }
  }
  if (!application) {
    return NextResponse.json({ ok: false, message: "Başvuru kaydedilemedi, lütfen tekrar deneyin." }, { status: 500 });
  }

  await mkdir(uploadDir, { recursive: true });
  const files = form.getAll("documents").filter((item): item is File => item instanceof File && item.size > 0);
  for (const file of files.slice(0, 6)) {
    if (file.size > 8 * 1024 * 1024) continue;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const filename = `${application.applicationNo}-${Date.now()}-${safeName}`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
    await prisma.applicationDocument.create({
      data: {
        applicationId: application.id,
        label: "Başvuru evrakı",
        url: `/uploads/basvurular/${filename}`,
        filename,
        mimeType: file.type || "application/octet-stream",
        size: file.size
      }
    });
  }

  const sms = await sendSms(data.phone, `Hayat Agaci basvurunuz alinmistir. Basvuru No: ${application.applicationNo}`);
  await prisma.smsLog.create({ data: { applicationId: application.id, phone: data.phone, message: sms.message, provider: sms.provider, status: sms.status } });

  return NextResponse.json({ ok: true, id: application.id, applicationNo: application.applicationNo, message: `Başvurunuz alınmıştır. Başvuru No: ${application.applicationNo}` });
}
