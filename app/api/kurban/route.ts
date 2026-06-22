import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  fullName: z.string().min(3),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  shares: z.coerce.number().int().positive().max(99),
  amount: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().nonnegative().optional()),
  type: z.enum(["KURBAN", "ADAK", "AKIKA", "SUKUR"]),
  note: z.string().optional()
});

async function nextOrderNo() {
  const year = new Date().getFullYear();
  const count = await prisma.sacrificeOrder.count({ where: { orderNo: { startsWith: `HK-${year}-` } } });
  return `HK-${year}-${String(count + 1).padStart(6, "0")}`;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = schema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Kurban bağış bilgileri eksik." }, { status: 400 });
  const data = parsed.data;
  const order = await prisma.sacrificeOrder.create({
    data: {
      orderNo: await nextOrderNo(),
      fullName: data.fullName,
      phone: data.phone || null,
      email: data.email || null,
      shares: data.shares,
      amount: data.amount ?? null,
      type: data.type,
      note: data.note || null
    }
  });
  return NextResponse.json({ ok: true, orderNo: order.orderNo, message: `Kurban kaydınız alınmıştır. Kayıt No: ${order.orderNo}` });
}
