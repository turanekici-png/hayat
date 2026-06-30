import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const address = "Sularbaşı Mh. 4. Sk. No: 8 Merkez/Sivas";
const mapQuery = encodeURIComponent(`Hayat Ağacı Derneği ${address}`);
const mapUrl = `https://maps.google.com/maps?hl=tr&q=${mapQuery}&z=17&iwloc=B&output=embed`;
const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

const contactItems = [
  {
    label: "Telefon",
    value: "+90 346 221 41 00",
    href: "tel:+903462214100",
    Icon: Phone,
    tone: "green"
  },
  {
    label: "E-posta",
    value: "bilgi@hayatder.org.tr",
    href: "mailto:bilgi@hayatder.org.tr",
    Icon: Mail,
    tone: "blue"
  },
  {
    label: "Adres",
    value: address,
    href: directionsUrl,
    Icon: MapPin,
    tone: "green"
  }
];

function iconTone(tone: string) {
  return tone === "blue" ? "bg-[#e8f5fb] text-hayat-blue" : "bg-[#edf7e5] text-hayat-green";
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="bg-[#f6f4ee]">
        <section className="border-b border-hayat-border bg-[#f6f4ee] px-3 py-8 sm:px-4 lg:px-4">
          <div className="mx-auto max-w-[1840px]">
            <h1 className="text-[42px] font-black leading-none tracking-tight text-hayat-dark sm:text-[54px] md:text-[64px]">
              Bize ulaşın
            </h1>
          </div>
        </section>

        <section className="px-3 py-10 sm:px-4 lg:px-4">
          <div className="mx-auto grid max-w-[1840px] gap-7 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="grid gap-4">
              {contactItems.map(({ label, value, href, Icon, tone }) => (
                <a
                  key={label}
                  href={href}
                  target={label === "Adres" ? "_blank" : undefined}
                  rel={label === "Adres" ? "noreferrer" : undefined}
                  className="group flex min-h-[118px] items-center gap-5 rounded-[22px] border border-[#d9e4ec] bg-white p-5 shadow-[0_18px_48px_rgba(10,58,85,0.07)] transition duration-300 hover:-translate-y-1 hover:border-hayat-green/60 hover:shadow-[0_24px_64px_rgba(10,58,85,0.12)]"
                >
                  <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-[18px] ${iconTone(tone)}`}>
                    <Icon size={27} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-hayat-green">{label}</span>
                    <span className="mt-2 block break-words text-[18px] font-black leading-7 text-hayat-dark transition group-hover:text-hayat-blue">{value}</span>
                  </span>
                </a>
              ))}

              <div className="min-h-[118px] rounded-[22px] border border-[#d9e4ec] bg-white p-5 shadow-[0_18px_48px_rgba(10,58,85,0.07)]">
                <div className="flex items-center gap-5">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[18px] bg-[#e8f5fb] text-hayat-blue">
                    <Clock size={27} />
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hayat-green">Çalışma Bilgisi</p>
                    <p className="mt-2 text-[18px] font-black leading-7 text-hayat-dark">Hafta içi mesai saatlerinde iletişim kanallarımızdan ulaşabilirsiniz.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#d9e4ec] bg-white shadow-[0_22px_70px_rgba(10,58,85,0.1)]">
              <div className="flex flex-col gap-5 border-b border-[#d9e4ec] bg-white p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hayat-green">Konum</p>
                  <h2 className="mt-2 text-3xl font-black text-hayat-dark md:text-4xl">Merkez/Sivas</h2>
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-[14px] bg-hayat-green px-5 text-xs font-black uppercase tracking-widest text-white shadow-green transition hover:-translate-y-0.5 hover:bg-hayat-blue"
                >
                  <Navigation size={16} /> Yol Tarifi
                </a>
              </div>

              <div className="relative h-[520px] bg-hayat-soft">
                <iframe
                  title="Hayat Ağacı Derneği konum haritası"
                  src={mapUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute left-5 top-5 max-w-[calc(100%-40px)] rounded-[20px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_44px_rgba(10,58,85,0.16)] backdrop-blur">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-hayat-green text-white">
                      <MapPin size={21} />
                    </span>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-hayat-green">Hayat Ağacı Derneği</p>
                      <p className="mt-1 text-sm font-black leading-6 text-hayat-dark">{address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
