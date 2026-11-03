# Yerel yazı tipleri

`app/layout.tsx`, Manrope ve Plus Jakarta Sans'ı `next/font/local` ile yükler.
Derleme sırasında Google Fonts sunucularına erişim gerekmez. Değişken TTF
dosyaları Latin ve Türkçe karakterleri içerir; mevcut CSS değişkenleri ve
kullanılan ağırlık aralıkları korunur.

Dosyalar Google Fonts deposundan, değiştirilmeden alınmıştır:

- Manrope: https://github.com/google/fonts/tree/main/ofl/manrope
- Plus Jakarta Sans: https://github.com/google/fonts/tree/main/ofl/plusjakartasans

Her fontun SIL Open Font License 1.1 lisansı aynı klasördeki `*-OFL.txt`
dosyasında bulunur. Fontları dağıtırken bu lisans dosyalarını da koruyun.
