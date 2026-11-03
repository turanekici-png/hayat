# Kesinti takibi ve otomatik toparlanma

## Ana sayfanın veritabanı hatalarında davranışı

Ana sayfadaki duyuru, açılır pencere ve bölüm başlığı sorguları başarısız
olduğunda yalnızca ilgili isteğe bağlı içerik atlanır; sayfanın tamamı hata
vermez. Başarısız sorgu kayıtları `home_widget_unavailable` olayıyla izlenir.
Geçici boş sonuçlar içerik önbelleğine yazılmaz. Menü tüm sayfaları topluca
önceden yüklemez; Next.js Link bileşeninin varsayılan davranışı kullanılır.

Bu davranış bir veritabanı arızasını gizlememelidir: `/api/health` arıza
süresince 503 döndürür. Bağış ve başvuru gibi veritabanına yazan işlemler
ayrı değerlendirilmelidir; ana sayfanın açılması bu işlemlerin çalıştığını
kanıtlamaz. Bağlantı kurulmadan oluşan ağ zaman aşımı da uygulama koduna
ulaşmadığı için bu değişiklikle giderilmiş sayılmaz.

Doğrulama:

```sh
npm run build
npm run test:availability
npm run test:home-resilience
```

Son test, üretim sunucusunu geçici bir yerel portta erişilemeyen bir test
veritabanı adresiyle başlatır. Migration veya veri yazma işlemi çalıştırmaz.
HTTP durumuna ek olarak ana sayfa içeriğinin gerçekten çizildiğini kontrol eder.

## Üretim başlatma yöntemi

Docker imajı `.next`, `public` ve üretim `node_modules` dizinlerini içerir.
`npm start`, veritabanı hazırlığından sonra standart `next start` sunucusunu
başlatır. `next.config.ts` bu yöntemle uyumlu standart derleme kullanır;
`output: "standalone"` seçeneği etkin değildir. Bu seçenek tekrar eklenirse
başlatma komutu ve Docker dosya kopyaları da standalone düzenine geçirilmelidir.

## Derlemenin dış font sunucularından bağımsız olması

Manrope ve Plus Jakarta Sans dosyaları `app/fonts` altında depoya eklenmiştir.
`next/font/local` kullanıldığı için `npm run build` sırasında Google Fonts
üzerinden CSS veya font indirilmez. Böylece font sunucularına erişim sorunu
yeni sürümün dağıtımını engellemez. Font kaynakları ve lisansları aynı klasördedir.

## Sunucudan bağımsız izleme

UptimeRobot'ta `https://hayatder.org.tr/` için HTTPS izleme kullanın.
Ücretsiz plan 5 dakikada bir kontrol yapar; kesinti ve düzelme bildirimleri
etkinleştirilen e-posta adresine gider. E-postadaki bağlantıyı açtıktan sonra
onay sayfasındaki **Activate** düğmesine de basılmalıdır. Yalnızca talep
göndermek izlemeyi etkinleştirmez. Beş dakikadan kısa kesintiler kaçabilir.

Bu değişiklik sunucuya dağıtıldıktan sonra ikinci bir HTTPS kontrolü ekleyin:
`https://hayatder.org.tr/api/health`. Bu adres uygulama ve PostgreSQL
erişimini denetler. Sağlıklıysa 200, bağlantı hatasında veya sorgu 3 saniye
içinde yanıtlamazsa 503 döndürür. Hata yanıtı bağlantı bilgilerini içermez.
Bu adres için Cloudflare önbellek kuralı uygulanmamalıdır.
Ana sayfa kontrolünü de koruyun: veritabanı kontrolünün başarılı olması
sayfanın tüm içeriklerinin ve tarayıcıdaki işlemlerin çalıştığını kanıtlamaz.

## Dokploy sağlık denetimi

Dockerfile ile oluşturulan imaj, `/api/health/live` adresini 30 saniyede
bir kontrol eder. İlk açılış için 180 saniye tolerans, ardından 3 başarısız
kontrol vardır. Bu adres veritabanından bağımsızdır; PostgreSQL kesintisi
web uygulamasını gereksiz yere yeniden başlatmaz.

Dokploy'da **Advanced → Swarm Settings → Health Check** alanında mevcut
bir ayar varsa imajdaki denetimi geçersiz kılmadığını doğrulayın. Gerekirse:

```json
{
  "Test": ["CMD", "node", "scripts/healthcheck.mjs"],
  "Interval": 30000000000,
  "Timeout": 8000000000,
  "StartPeriod": 180000000000,
  "Retries": 3
}
```

Süreler Docker API biçiminde nanosaniyedir. Arayüzde süre alanları ayrıysa
30 saniye aralık, 8 saniye zaman aşımı, 180 saniye başlangıç süresi kullanın.
**Restart Policy** başarısız görevleri yeniden başlatacak şekilde olmalıdır.
Panel değişiklikleri için Redeploy gerekir. Docker Swarm sağlıksız görevleri
yeniler; tek başına normal `docker run` sağlık denetimi yeniden başlatmaz.
Nixpacks/Buildpacks kullanılıyorsa Dockerfile'daki HEALTHCHECK uygulanmaz;
aynı denetimi Dokploy panelinde tanımlayın.

## Hata olduğunda

İzleme hizmetindeki kesinti saatiyle Dokploy uygulama ve PostgreSQL kayıtlarını
karşılaştırın. RAM/CPU ve görev yeniden başlatmalarını aynı zaman aralığında
inceleyin. `health_check_failed` kaydı veritabanı kontrolünün başarısız olduğunu
gösterir. Dış kontrol DNS, TLS ve Cloudflare/sunucu erişimindeki kesintileri de
yakalar; yalnızca konteyner içi denetim bunları göremez.

Medya aktarımı, tarayıcı aktarımı iptal ettiğinde `Readable.toWeb()` kaynaklı
`Controller is already closed` yarışını önlemek için pull tabanlı
`ReadableStream.from()` kullanır. Bu değişiklik, kayıtlardaki tüm akış
hatalarının aynı kaynaktan geldiği veya tüm kesintilerin giderildiği anlamına
gelmez. Server Action sürüm uyuşmazlığı için eski sekmeler yenilenmeli ve
birden fazla kopya çalışıyorsa aynı derleme çıktısı kullanılmalıdır.
