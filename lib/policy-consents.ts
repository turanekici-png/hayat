import { prisma } from "@/lib/prisma";

export type PolicyConsentItem = {
  type: string;
  fieldName: "kvkkConsent" | "privacyConsent" | "refundConsent";
  title: string;
  href: string;
  linkLabel: string;
  text: string;
};

export const policyConsentDefaults: PolicyConsentItem[] = [
  {
    type: "CONSENT_KVKK",
    fieldName: "kvkkConsent",
    title: "KVKK onay metni",
    href: "/kvkk",
    linkLabel: "KVKK Aydınlatma Metni",
    text: "KVKK Aydınlatma Metnini okudum ve kabul ediyorum."
  },
  {
    type: "CONSENT_TERMS_PRIVACY",
    fieldName: "privacyConsent",
    title: "Kullanım koşulları ve gizlilik onay metni",
    href: "/kullanim-kosullari-ve-gizlilik-politikasi",
    linkLabel: "Kullanım Koşulları ve Gizlilik Politikası",
    text: "Kullanım Koşulları ve Gizlilik Politikasını kabul ediyorum."
  },
  {
    type: "CONSENT_REFUND",
    fieldName: "refundConsent",
    title: "İade politikası onay metni",
    href: "/iade-politikasi",
    linkLabel: "İade Politikası",
    text: "İade Politikası hakkında bilgilendirildim."
  }
];

export async function getPolicyConsentItems(): Promise<PolicyConsentItem[]> {
  const rows = await prisma.policyPage.findMany({
    where: { type: { in: policyConsentDefaults.map((item) => item.type) } }
  });

  return policyConsentDefaults.map((item) => {
    const row = rows.find((policy) => policy.type === item.type);
    return {
      ...item,
      text: row?.content?.trim() || item.text
    };
  });
}
