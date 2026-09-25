# Git-to-Portfolio

Herhangi bir herkese açık GitHub profilini sade, paylaşılabilir ve yazdırmaya hazır bir geliştirici portföyüne dönüştürür. Kayıt yok, veritabanı yok, sunucuda kullanıcı verisi yok.

**[Canlı demo](https://git-to-portfolio.vercel.app)** · [Kaynak](https://github.com/Kcguner/git-to-portfolio) · [English](README.md) | Türkçe

Hemen deneyebileceğiniz gerçek portföyler:

- [`/kcguner`](https://git-to-portfolio.vercel.app/kcguner) — bu sitenin yaratıcısı
- [`/torvalds`](https://git-to-portfolio.vercel.app/torvalds) — Linux'un yaratıcısı

![CI](https://github.com/Kcguner/git-to-portfolio/actions/workflows/ci.yml/badge.svg) ![Lisans: MIT](https://img.shields.io/github/license/Kcguner/git-to-portfolio) ![Next.js 16](https://img.shields.io/badge/Next.js-16.3.6-000000?style=flat-square&logo=next.js) ![Node 20](https://img.shields.io/badge/node-%3E%3D20.9-5FA04E?style=flat-square)

## Özellikler

- Avatar, bio, konum, sosyal linkler ve takipçi/repo sayılarıyla birlikte herkese açık profil
- Fork ve arşivlenmiş depolar hariç, altı öne çıkan repo
- Öne çıkan repo dillerinin repo sayısına göre dağılımı
- Sunucu tarafında çözümlenen Türkçe, İngilizce, Almanca ve İspanyolca arayüz
- Tek tıkla **PDF olarak kaydet** çıktısı veren, yazdırmaya optimize edilmiş stil dosyası
- Erişilebilir pano yedeğiyle birlikte yerel Web Share desteği
- Profil başına üretilen, lokalize Open Graph ve Twitter kart görselleri
- Yüklenebilir web uygulaması meta verisi
- Bir saatlik GitHub API yeniden doğrulama
- Zorunlu coverage eşikleri olan Vitest testleri, TypeScript, ESLint ve CI

## Gereksinimler

Node.js 20.9 veya üzeri, npm 10 veya üzeri.

## Hızlı Başlangıç

```bash
npm ci
cp .env.example .env.local
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini açın.

## Kullanım

Bir GitHub kullanıcı adı, `@kullanıcı` biçimi veya tam `https://github.com/kullanici` adresi yazın. Girdi doğrulanır, küçük harfe çevrilir ve kodlanarak yönlendirme yapılır.

Fork ve arşivlenmiş depolar çıkarıldıktan sonra yıldıza göre sıralanan ilk altı repo gösterilir. Dil barları, bu altı reponun kaç tanesinin her bir dili kullandığını sayar — kod satırı veya bayt ölçümü değildir. İlk üç dil gösterildiğinden yüzdelerin toplamı 100 etmeyebilir.

## Diller

Varsayılan dil Türkçe'dir (`tr`). Header'daki seçiciyi kullanın veya herhangi bir adrese `lang` ekleyin:

| Dil | Ana sayfa | Örnek profil |
| --- | --- | --- |
| English | `/?lang=en` | `/torvalds?lang=en` |
| Deutsch | `/?lang=de` | `/torvalds?lang=de` |
| Español | `/?lang=es` | `/torvalds?lang=es` |

Eksik, tekrar eden veya desteklenmeyen `lang` değerleri Türkçe'ye düşer. `proxy.js` dili her istekte bir kez çözer — açık bir `?lang=` kazanır, yoksa `Accept-Language` başlığı pazarlık edilir, o da yoksa Türkçe kullanılır — ve sonucu içer bir istek başlığıyla layout'a geçirir. Böylece `<html lang>` hydration'dan sonra değil, ilk HTML'de doğru olur.

## Ortam Değişkenleri

```env
# Paylaşım, metadata, robots.txt ve sitemap.xml için canonical adres.
# Sondaki / olmadan, mutlak HTTPS adresi.
SITE_URL=https://git-to-portfolio.vercel.app

# Header ve footer'da gösterilen kaynak deposu.
GITHUB_REPO_URL=https://github.com/Kcguner/git-to-portfolio

# İsteğe bağlı, ancak herkese açık bir dağıtım için güçlü şekilde önerilir.
GITHUB_TOKEN=github_pat_...
```

Üçü de yalnızca sunucuda okunur ve tarayıcıya gönderilmez; bu yüzden hiçbiri `NEXT_PUBLIC_` öneki taşımaz. `SITE_URL` ve `GITHUB_REPO_URL` için makul varsayılanlar vardır, bu yüzden yalnızca alan adınız veya deponuz farklıysa tanımlamanız gerekir.

**Token hakkında.** Anonim GitHub istekleri saatte 60 ile sınırlıdır ve çıkış IP adresi başına sayılır; paylaşımlı bir sunucuda bu, sitenizin aynı adresteki herkesle rekabet etmesi demektir. Bir profil görüntülemesi iki istek harcar, dolayısıyla anonim tavan saatte yaklaşık 30 farklı profildir. Token bu limiti saatte 5.000'e çıkarır. Fine-grained token **hiçbir yetkiye ihtiyaç duymaz** — GitHub'daki herkese açık tüm depoları okuyabilir ve uygulamanın yaptığı da tam olarak budur. [Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new) üzerinden oluşturun ve yalnızca Production ortamında tanımlayın.

## Nasıl Çalışır

1. `GET /users/:username` herkese açık profili yükler.
2. `GET /users/:username/repos` depoları yükler; fork ve arşivlenmiş kayıtlar elenir, sonuç yerelde yıldıza göre sıralanır.
3. Her iki yanıt bir saat önbelleklenir. Dil çerezde değil, URL'de taşınır.

Depolar için Search API yerine core API kullanılır. Anonim arama, bazı herkese açık hesapları hiç yanıt vermeden `422 Validation Failed` ile reddediyor ve bu da geçerli bir profili reposu boş göstermek anlamına geliyor; ayrıca arama API'si saatte 60 olan core API'ye kıyasla dakikada 10 istekle sınırlıdır. Bunun bedeli sıralama kapsamıdır: core API yıldıza göre sıralayamaz, bu yüzden altı kart, kullanıcının en son push edilmiş 100 reposu içindeki en yıldızlılardır ve hesapların büyük çoğunluğu için bu tam olarak doğrudur. Bu pencereyi genişletmek için `lib/github.ts` içindeki `DEFAULT_REPO_PAGES` değerini artırın.

## Paylaşım ve Yazdırma

**Paylaşım** aksiyonu, mümkün olan yerde yerel Web Share API'sini kullanır, yoksa Pano API'sine düşer ve sonucu canlı bir bölgeyle duyurur. Mesaj kendiliğinden kapanır, kurtarma talimatı içeriyorsa daha uzun kalır ve her zaman elle kapatılabilir.

**Yazdır / PDF'ye kaydet** aksiyonu tarayıcının yazdırma penceresini açar. Yazdırma stil dosyası gezinme ve kontrolleri gizler, dil barlarını tarayıcıların arka plan gradyanlarını kaldırması nedeniyle düz griye çevirir ve açık koyu renkli metni okunabilir koyu renge zorlar; böylece repo adları beyaz üstüne beyaz yazdırılmaz.

## Kalite Kontrolleri

```bash
npm run typecheck
npm run lint
npm run test:run
npm run test:coverage
npm run build
npm audit --omit=dev
```

Coverage eşikleri `vitest.config.mts` içinde tanımlıdır ve düşerse komutu başarısız kılar. CI, Node.js 20 ve 22 üzerinde aynı kapıyı ve üretim bağımlılık denetimini çalıştırır.

## Dağıtım

[![Vercel ile dağıt](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Kcguner/git-to-portfolio.git)

1. Yukarıdaki butondan dağıtın veya deponu Vercel'e içe aktarın.
2. Settings → Environment Variables altında `GITHUB_TOKEN` ekleyin, kapsam Production olsun.
3. Üretim alan adınız varsayılandan farklıysa `SITE_URL` değerini ayarlayın.

`NEXT_PUBLIC_` değerleri build sırasında pakete gömülür, bu yüzden bunları build'den **önce** değiştirin, sonra değil.

## Teknoloji

Next.js 16 App Router · React 19 · Tailwind CSS 3 · GitHub REST API · Vitest · GitHub Actions

## Etiketler

`nextjs` `portfolio-generator` `github-api` `open-graph` `print-to-pdf`

## Bilinen Sınırlamalar

- **Yükleme iskeleti yok.** Bir `loading.tsx` akış tabanlı render'ı etkinleştirir ve Next.js, başlıklar gönderildiği için akış tabanlı yanıtlarda `200` döner. Bilinmeyen bir kullanıcı adı o zaman yalnızca iskeletle `200` yanıtı verirdi; arama motorları bunu soft 404 sayar. Doğru durum kodu, yükleme animasyonundan önce gelir.
- **Önbellek olarak yalnızca rate limit var.** API rotası ve ek bir önbellek katmanı yok. Token, herkese açık bir dağıtımı ayakta tutan şeydir.
- **404 gövdesi istemcide hydrate ediliyor.** Durum, lokalize `<title>` ve `noindex` meta verisi ilk HTML'de doğru, ancak görünür işaretleme RSC payload'ı üzerinden geliyor; çünkü `notFound()` `NEXT_HTTP_ERROR_FALLBACK;404` fırlatarak çalışıyor.
- **Çevrimdışı destek yok.** Web uygulaması manifesti yüklenebilirlik meta verisi sağlıyor, ancak çevrimdışı kullanım için hiçbir şey önbelleklenmiyor.

## Lisans

MIT — bkz. [`LICENSE`](LICENSE).
