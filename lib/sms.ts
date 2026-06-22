export async function sendSms(phone: string, message: string) {
  const provider = process.env.SMS_PROVIDER || "demo";

  // 1. DEMO MOD: Gerçek SMS göndermez
  if (provider === "demo") {
    console.log(`[DEMO SMS] To: ${phone}, Msg: ${message}`);
    return { provider, status: "DEMO_SENT", phone, message };
  }

  // 2. NETGSM ENTEGRASYONU (Hazır Taslak)
  if (provider === "netgsm") {
    const user = process.env.NETGSM_USER;
    const pass = process.env.NETGSM_PASS;
    const header = process.env.NETGSM_HEADER;

    if (!user || !pass || !header) {
      console.error("NetGSM API bilgileri eksik.");
      return { provider, status: "CONFIG_ERROR", phone, message };
    }

    // Burada NetGSM HTTP API veya SOAP API çağrısı yapılır.
    // Örnek: axios.get(`https://api.netgsm.com.tr/sms/send/get/?user=${user}&pass=${pass}&msg=${message}&no=${phone}&header=${header}`)
    
    return { provider, status: "QUEUED", phone, message };
  }

  return { provider, status: "UNKNOWN_PROVIDER", phone, message };
}
