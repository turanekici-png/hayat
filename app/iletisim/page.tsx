import Link from "next/link";
import { ArrowLeft, Building2, Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
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
    Icon: Phone
  },
  {
    label: "E-posta",
    value: "bilgi@hayatder.org.tr",
    href: "mailto:bilgi@hayatder.org.tr",
    Icon: Mail
  },
  {
    label: "Adres",
    value: address,
    href: directionsUrl,
    Icon: MapPin
  }
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="bg-hayat-soft">
        <section className="border-b border-hayat-border bg-hayat-soft px-3 py-12 sm:px-4 lg:px-4">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-hayat-blue transition hover:text-hayat-green">
                <ArrowLeft size={18} /> Ana sayfaya dön
              </Link>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-hayat-green">İletişim</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-tight text-[#1f3444] md:text-7xl">
                Bize ulaşın
              </h1>
              <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-[#607081] md:text-lg">
                Bağış, başvuru, kurumsal süreçler ve saha faaliyetleriyle ilgili sorularınız için bizimle iletişime geçebilirsiniz.
              </p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-[14px] border border-hayat-border bg-white px-5 py-4 text-sm font-black text-[#5d6b70] shadow-stk">
              <Building2 className="text-hayat-blue" size={20} />
              Hayat Ağacı Derneği
            </div>
          </div>
        </section>

        <section className="px-3 py-14 sm:px-4 lg:px-4">
          <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <div className="grid gap-5">
              {contactItems.map(({ label, value, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={label === "Adres" ? "_blank" : undefined}
                  rel={label === "Adres" ? "noreferrer" : undefined}
                  className="group flex items-start gap-5 rounded-[20px] border border-hayat-border bg-white p-6 shadow-stk transition hover:-translate-y-1 hover:border-hayat-green hover:shadow-stk-hover"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-hayat-mint text-hayat-green">
                    <Icon size={25} />
                  </span>
                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.2em] text-hayat-green">{label}</span>
                    <span className="mt-2 block text-lg font-black leading-7 text-[#1f3444] transition group-hover:text-hayat-blue">{value}</span>
                  </span>
                </a>
              ))}

              <div className="rounded-[20px] border border-hayat-border bg-white p-6 shadow-stk">
                <div className="flex items-start gap-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#cfe6f3] text-hayat-blue">
                    <Clock size={25} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-hayat-green">Çalışma Bilgisi</p>
                    <p className="mt-2 text-lg font-black leading-7 text-[#1f3444]">Hafta içi mesai saatlerinde iletişim kanallarımızdan ulaşabilirsiniz.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-hayat-border bg-white shadow-stk">
              <div className="flex flex-col gap-5 border-b border-hayat-border p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-hayat-green">Konum</p>
                  <h2 className="mt-2 text-3xl font-black text-[#1f3444]">Merkez/Sivas</h2>
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-[14px] bg-hayat-green px-5 text-xs font-black uppercase tracking-widest text-white shadow-green transition hover:bg-hayat-blue"
                >
                  <Navigation size={16} /> Yol Tarifi
                </a>
              </div>
              <div className="relative h-[440px] bg-hayat-soft">
                <iframe
                  title="Hayat Ağacı Derneği konum haritası"
                  src={mapUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute left-5 top-5 max-w-[calc(100%-40px)] rounded-[20px] border border-hayat-border bg-white/95 p-4 shadow-stk backdrop-blur">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hayat-green text-white">
                      <MapPin size={20} />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-hayat-green">Hayat Ağacı Derneği</p>
                      <p className="mt-1 text-sm font-black leading-6 text-[#1f3444]">{address}</p>
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
