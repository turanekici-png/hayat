import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function receiptYearRange(date: Date) {
  const year = date.getFullYear();
  return {
    year,
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1)
  };
}

async function nextReceiptNo(tx: Prisma.TransactionClient, date: Date, excludeDonationId: string, offset = 0) {
  const { year, start, end } = receiptYearRange(date);
  const paidDonationCount = await tx.donation.count({
    where: {
      status: "PAID",
      createdAt: {
        gte: start,
        lt: end
      },
      NOT: {
        id: excludeDonationId
      }
    }
  });

  return `HB-${year}-${String(paidDonationCount + offset + 1).padStart(6, "0")}`;
}

function isReceiptNoConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("receiptNo");
}

export async function updateDonationWithReceiptOnPaid(
  where: Prisma.DonationWhereUniqueInput,
  data: Prisma.DonationUpdateInput & { status?: string }
) {
  if (!data.status) {
    return prisma.donation.update({ where, data });
  }

  if (data.status !== "PAID") {
    return prisma.donation.update({
      where,
      data: {
        ...data,
        receiptNo: null
      }
    });
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const donation = await tx.donation.findUnique({
          where,
          select: {
            id: true,
            receiptNo: true,
            createdAt: true
          }
        });

        if (!donation) {
          throw new Error("Bağış kaydı bulunamadı.");
        }

        const updateData: Prisma.DonationUpdateInput = { ...data };
        if (!donation.receiptNo) {
          updateData.receiptNo = await nextReceiptNo(tx, donation.createdAt, donation.id, attempt);
        }

        return tx.donation.update({
          where: { id: donation.id },
          data: updateData
        });
      });
    } catch (error) {
      if (isReceiptNoConflict(error)) continue;
      throw error;
    }
  }

  throw new Error("Makbuz numarası oluşturulamadı. Lütfen tekrar deneyin.");
}
