
# HayatDer Next.js Bağış ve Yönetilebilir Web Platformu

## Başlatma
1. PostgreSQL çalışıyor olmalı.
2. `.env` içindeki şifreyi kendi PostgreSQL şifrenize göre düzenleyin.
3. `baslat.bat` dosyasına çift tıklayın.

Yerel adres: `http://localhost:4000`
Ağ adresi: `http://BILGISAYAR-IP:4000`
Yönetim paneli: `http://localhost:4000/admin`

## Yönetim Paneli
- Ana sayfa alanı ekleme / kaldırma
- Alanları aktif/pasif yapma
- Sıralama değiştirme
- Başlık, metin, buton, link ve görsel yolu düzenleme
- Görsel yükleme (`public/uploads`)
- Son bağış kayıtlarını görüntüleme

## Sanal POS
Şu anda demo ödeme akışı vardır. Canlı POS için banka/PayTR/iyzico/Param/Sipay bilgileri `lib/pos.ts` içinde ilgili sağlayıcıya göre bağlanmalıdır.

## Online Yardım Başvurusu

Bu sürümde online yardım başvuru modülü eklendi.

- Başvuru formu: `/basvuru`
- Admin başvuru listesi: `/admin/basvurular`
- Başvurular `AidApplication` tablosunda saklanır.
- Admin panelden durum güncelleme, not yazma ve silme yapılabilir.

Yeni veritabanı alanları için ilk çalıştırmada veya güncelleme sonrası:

```cmd
npx prisma db push
npm run dev
```

`baslat.bat` zaten Prisma Client üretip veritabanını senkronize etmeye çalışır.

## V7 - KVKK / Gizlilik / İade Politikası

Online bağış formuna KVKK Aydınlatma Metni, Kullanım Koşulları ve Gizlilik Politikası, İade Politikası onayları eklendi.

Yönetim paneli:

```text
http://localhost:4000/admin/politikalar
```

Ağdan erişim için:

```text
http://SUNUCU_IP:4000/admin/politikalar
```

İlk açılışta politika metinleri yoksa yönetim panelindeki "Varsayılan Metinleri Oluştur" butonuna basın. Daha sonra kurumun resmi metinlerini bu alandan düzenleyin.

## V8 Yeni Özellikler

- `/basvuru-takip`: Başvuru no ile vatandaş takip ekranı.
- Başvuru formunda evrak yükleme.
- Admin başvuru ekranında evrak, SMS log, vatandaş takip notu ve admin notu.
- `/bagis/makbuz/[id]`: Bağış makbuzu görüntüleme.
- `/kurban`: Kurban/adak/akika/şükür kayıt formu.
- `/admin/kurban`: Kurban kayıtları yönetim listesi.
- `lib/sms.ts`: Demo SMS altyapısı. Canlı SMS için sağlayıcı API bilgileri ile genişletilir.

Veritabanı güncellemesi için:

```cmd
npx prisma generate
npx prisma db push
```

Sonra:

```cmd
baslat.bat
```

## v17 Notu
Bu sürümde ana sayfaya Hakkımızda, Misyonumuz ve Vizyonumuz alanları eklendi.
Admin panelden yapılan ana sayfa değişikliklerinin daha hızlı görünmesi için sayfalar dinamik hale getirildi.
Eski veritabanlarında yeni kurumsal alanlar admin panelde görünmezse `/admin` ekranındaki "Varsayılan/Eksik Alanları Panele Aktar" butonuna bir kez basın.


## V24 Notu
Admin panelde "Server Action was not found" hatası alınmaması için `baslat.bat` her başlangıçta `.next` geçici derleme klasörünü temizler. Güncel sürüme geçince eski terminali kapatıp `baslat.bat` ile yeniden başlatın ve tarayıcıda CTRL+F5 yapın.
