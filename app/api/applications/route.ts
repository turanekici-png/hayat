import { NextResponse } from "next/server";
import { z } from "zod";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { publicPath } from "@/lib/public-files";

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

async function nextApplicationNo() {
  const year = new Date().getFullYear();
  const count = await prisma.aidApplication.count({
    where: { applicationNo: { startsWith: `HA-${year}-` } }
  });
  return `HA-${year}-${String(count + 1).padStart(6, "0")}`;
}

const uploadDir = publicPath("uploads", "basvurular");

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = applicationSchema.safeParse(Object.fromEntries(form.entries()));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.errors[0]?.message || "Başvuru bilgileri eksik." }, { status: 400 });
  }

  const data = parsed.data;
  const applicationNo = await nextApplicationNo();
  const application = await prisma.aidApplication.create({
    data: {
      applicationNo,
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
