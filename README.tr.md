# Git-to-Portfolio

Herhangi bir herkese açık GitHub profilini sade, paylaşılabilir ve yazdırmaya hazır bir geliştirici portföyüne dönüştürür. Kayıt yok, veritabanı yok, sunucuda kullanıcı verisi yok.

**[Canlı demo](https://git-to-portfolio.vercel.app)** · [Kaynak](https://github.com/Kcguner/git-to-portfolio) · [English](README.md) | Türkçe

Hemen deneyebileceğiniz gerçek portföyler:

- [`/tr/kcguner`](https://git-to-portfolio.vercel.app/tr/kcguner) — bu sitenin yaratıcısı
- [`/tr/torvalds`](https://git-to-portfolio.vercel.app/tr/torvalds) — Linux'un yaratıcısı

![CI](https://github.com/Kcguner/git-to-portfolio/actions/workflows/ci.yml/badge.svg) ![Lisans: MIT](https://img.shields.io/github/license/Kcguner/git-to-portfolio) ![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2-000000?style=flat-square&logo=next.js) ![Node 20](https://img.shields.io/badge/node-%3E%3D20.9-5FA04E?style=flat-square)

## Özellikler

- Maviplan kimliği: saç teli kenarlıklı paftalar, titleblock şeritleri, spec tabloları, 2px keskin köşeler; gradyan, parlama ve sürekli hareket yok
- Varsayılan olarak derin lacivert gece teması, kâğıt beyazı ters çevirimi ve header'da geçiş düğmesi; seçim çerezde tutulur ve ilk boyamadan önce uygulanır
- Avatar, bio, konum, sosyal linkler ve takipçi/repo sayılarıyla birlikte herkese açık profil
- Önce kullanıcının profiline sabitlediği repolar; token yoksa veya sabitlenmiş repo yoksa yıldıza göre sıralamaya düşer
- Repo sayısına göre hesaplanan ve okuyucunun diline göre yazılan öne çıkan dil dağılımı
- Her proje hücresinde mono yazıyla etiketlenmiş repo konuları
- Her biri kendi adresinde olan Türkçe, İngilizce, Almanca ve İspanyolca arayüz: `/tr`, `/en`, `/de`, `/es`
- Statik sayfalar: ana sayfa dil başına build'de önceden üretilir, profil sayfaları aralıklarla yeniden doğrulanır
- Yerine durduğu projelerin çizimini taklit eden, akış tabanlı repo bloğu yükleme iskeleti
- Tek tıkla **PDF olarak kaydet** çıktısı veren, yazdırmaya optimize edilmiş stil dosyası
- Erişilebilir pano yedeğiyle birlikte yerel Web Share desteği
- Profil ve dil başına üretilen, maviplan kartı olarak çizilen lokalize Open Graph ve Twitter görselleri
- Dil başına lokalize başlık, açıklama, anahtar kelimeler, hreflang kümesi ve JSON-LD yapılandırılmış verisi
- Statik bir Content-Security-Policy; sıkı politika ayrıca report-only olarak da gönderilir
- Yüklenebilir web uygulaması meta verisi
- Önbelleklenmiş GitHub çağrıları: repo listesi bir saat, sabitlenmiş liste on dakika, sosyal kart bir dakika
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

Altı repo gösterilir; fork ve arşivlenmiş depolar elenir. **Önce kullanıcının GitHub profiline sabitlediği repolar gelir**, seçtikleri sırayla; bu liste boş olduğunda — `GITHUB_TOKEN` yok ya da hiçbir şey sabitlenmemiş — sayfa yıldıza göre sıralanan en çok yıldızlı repolara düşer. Bölüm başlığı bunlardan hangisinin görüntülendiğini söyler, çünkü kullanıcının seçtiği bir liste ile bizim sıraladığımız bir liste aynı iddia değildir.

Dil barları, bu altı reponun kaç tanesinin her bir dili kullandığını sayar — kod satırı veya bayt ölçümü değildir. İlk üç dil gösterildiğinden yüzdelerin toplamı 100 etmeyebilir. Her pay `Intl` ile sayfanın diline göre yazılır: İngilizcede `60%`, Türkçede `%60`, Almanca ve İspanyolcada `60 %`.

## Diller

Varsayılan dil Türkçe'dir (`tr`). Dil adrese parametre olarak değil, adresin bir parçası olarak eklenir; her dil kendi sayfasıdır:

| Dil | Ana sayfa | Örnek profil |
| --- | --- | --- |
| Türkçe | `/tr` | `/tr/torvalds` |
| English | `/en` | `/en/torvalds` |
| Deutsch | `/de` | `/de/torvalds` |
| Español | `/es` | `/es/torvalds` |

Header'daki seçiciyi kullanın ya da istediğiniz dilin adresini açın. Dil adresin içinde olduğu için dördü de ayrı önbelleklenen, ayrı dizine eklenebilen belgelerdir — bir arama motoru İngilizce sayfayı Türkçe sayfanın kopyası olmadan kendi koşullarıyla sıralayabilir.

Adresi dil belirtemeyen tek adres çıplak `/`'dir ve tek pazarlık yeridir. Ziyaretçinin diline göre `302` ile yanıt verir: `site-locale` çerezi bir dil tutuyorsa o kazanır, yoksa `Accept-Language` başlığı pazarlık edilir, o da yoksa Türkçe kullanılır. Pazarlık edilen seçim çereze geri yazılır, böylece kök yalnızca bir kez tahmin etmek zorunda kalır.

Eski adreslerin hepsi hâlâ çalışır ve kalıcıdır. `/?lang=en` `/en` adresine `308`, `/torvalds?lang=de` `/de/torvalds` adresine `308` yanıt verir; çıplak `/torvalds` ise `/tr/torvalds` adresine `308` verir. Eski sorgu biçiminde eksik, tekrar eden ya da desteklenmeyen `lang` Türkçe'ye çözülür.

## Ortam Değişkenleri

```env
# Paylaşım, metadata, robots.txt ve sitemap.xml için canonical adres.
# Sondaki / olmadan, mutlak HTTPS adresi.
SITE_URL=https://git-to-portfolio.vercel.app

# Header ve footer'da gösterilen kaynak deposu.
GITHUB_REPO_URL=https://github.com/Kcguner/git-to-portfolio

# İsteğe bağlı, ancak herkese açık bir dağıtım için güçlü şekilde önerilir.
# Sabitlenmiş repo listesini de bu açar; token olmadan sayfa yıldız
# sıralamasına düşer.
GITHUB_TOKEN=github_pat_...
```

Üçü de yalnızca sunucuda okunur ve tarayıcıya gönderilmez; bu yüzden hiçbiri `NEXT_PUBLIC_` öneki taşımaz. `SITE_URL` ve `GITHUB_REPO_URL` için makul varsayılanlar vardır, bu yüzden yalnızca alan adınız veya deponuz farklıysa tanımlamanız gerekir.

**Token hakkında.** Anonim GitHub istekleri saatte 60 ile sınırlıdır ve çıkış IP adresi başına sayılır; paylaşımlı bir sunucuda bu, sitenizin aynı adresteki herkesle rekabet etmesi demektir. Bir profil görüntülemesi iki istek harcar, dolayısıyla anonim tavan saatte yaklaşık 30 farklı profildir. Token bu limiti saatte 5.000'e çıkarır. Fine-grained token **hiçbir yetkiye ihtiyaç duymaz** — GitHub'daki herkese açık tüm depoları okuyabilir ve uygulamanın yaptığı da tam olarak budur. [Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new) üzerinden oluşturun ve yalnızca Production ortamında tanımlayın.

## Nasıl Çalışır

1. `GET /users/:username` herkese açık profili yükler.
2. GraphQL `pinnedItems` kullanıcının seçtiği depoları seçtikleri sırayla yükler. Bu istek `GITHUB_TOKEN` gerektirir — GraphQL API'nin anonim kotası yoktur — ve herhangi bir hatada `null` döndürür, bu yüzden token yoksa bu adım atlanır.
3. `GET /users/:username/repos` yedek yoldur; fork ve arşivlenmiş kayıtlar elenir, sonuç yerelde yıldıza göre sıralanır.
4. İki arama paralel çalışır ve her iki yanıt önbelleklenir: sabitlenmiş liste on dakika, repo listesi bir saat. Dil çerezde değil, URL'de taşınır.

Yedek sıralama için Search API yerine core API kullanılır. Anonim arama, bazı herkese açık hesapları hiç yanıt vermeden `422 Validation Failed` ile reddediyor ve bu da geçerli bir profili reposu boş göstermek anlamına geliyor; ayrıca arama API'si saatte 60 olan core API'ye kıyasla dakikada 10 istekle sınırlıdır. Bunun bedeli sıralama kapsamıdır: core API yıldıza göre sıralayamaz, bu yüzden altı kart, kullanıcının en son push edilmiş 30 reposu içindeki en yıldızlılardır ve hesapların büyük çoğunluğu için bu tam olarak doğrudur. Bu pencereyi genişletmek için `lib/github.ts` içindeki `REPO_RANKING_WINDOW` değerini artırın.

Her sayfa statik bir belgedir. Ana sayfa build sırasında dil başına önceden üretilir, profil sayfaları aralıklarla yeniden doğrulanır; böylece bir portföy her istekte yeniden render edilmek yerine edge önbelleğinden gelir. Dil build zamanı değeri oldu çünkü artık yolda; ve root layout artık istek zamanı değeri okumuyor: tema sunucuda çerezden okunmak yerine küçük bir satır içi betikle uygulanıyor. Root layout'taki bir istek zamanı değeri bütün rotaları dinamik ve önbelleklenemez yapıyordu.

## Paylaşım ve Yazdırma

**Paylaşım** aksiyonu, mümkün olan yerde yerel Web Share API'sini kullanır, yoksa Pano API'sine düşer ve sonucu canlı bir bölgeyle duyurur. Mesaj kendiliğinden kapanır, kurtarma talimatı içeriyorsa daha uzun kalır ve her zaman elle kapatılabilir.

**Yazdır / PDF'ye kaydet** aksiyonu tarayıcının yazdırma penceresini açar. Yazdırma stil dosyası gezinme ve kontrolleri gizler, dil barlarını yazıcının kaybedememesi için düz griye yeniden boyar ve açık koyu renkli metni okunabilir koyu renge zorlar; böylece repo adları beyaz üstüne beyaz yazdırılmaz.

## Arama Motorları ve Paylaşım

Her sayfa, kendisini tarayıcılara render edildiği dilde anlatır ve bunun nasıl yapılacağına tek başına `lib/seo.ts` karar verir:

- **Canonical ve hreflang.** Her sayfanın `canonical` değeri kendi lokalize adresidir — dil yolun ilk segmentidir, yani adres `/{locale}` ya da `/{locale}/{kullanıcı}` olur — ve her sayfa tam kümenin tamamını — `tr-TR`, `en-US`, `de-DE`, `es-ES` ve `x-default` — `<head>` ile `sitemap.xml` içinde mutlak `hreflang` alternatifleri olarak taşır.
- **Başlık, açıklama ve anahtar kelimeler.** Dil başına lokalize; portföy sayfalarında kişinin adı da anahtar kelime kümesinde yer alır, böylece "adı + portföy" araması onu dört dilin herhangi birinde bulabilir.
- **Yapılandırılmış veri.** Okuyucunun dilinde JSON-LD: site `WebSite` ve `WebApplication` olarak, ana sayfanın sayfada görünen üç adımı `HowTo` olarak, portföy sayfası ise konusu `Person` olan bir `ProfilePage` olarak; gösterilen altı repo `SoftwareSourceCode`, dilleri ise `knowsAbout` olarak. Yalnızca sayfanın gösterdiği bilgiler yayımlanır ve entity id varsayılan dilin adresidir; böylece dört dil bir kişiyi dört kişi olarak değil, bir kişi olarak anlatır.
- **Sosyal kartlar.** Dil başına bir görsel: `/{locale}/opengraph-image/{locale}` ve `/{locale}/{kullanıcı}/opengraph-image/{locale}`. Dil sorgu parametresi değil, yol segmentidir; çünkü sosyal tarayıcılar görsel adresini tek başına ister. Böylece her dil ayrı bir önbellek kaydıdır ve ana sayfa kartları build sırasında önceden üretilir. `og:locale:alternate` ise Facebook, LinkedIn ve Slack'e sayfayla eşleşen kartı söyler.
- **Sitemap.** Sayfa ve dil başına bir kayıt; her kayıt tam hreflang kümesini tekrarlar ve uydurma `lastmod` içermez. İki 404 segmenti `noindex`'tir ve okuyucunun dilinde bir kart taşır.

Sayfanın render edildiği dil çerezden değil URL'den gelir; bu yüzden `/tr` isteyen — ya da `/en`, `/de`, `/es` — bir tarayıcı her zaman o adres için aynı belgeyi ve aynı meta veriyi alır; dördü de kendi başına kararlı ve dizine eklenebilir birer adrestir.

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

- **Proje listesi ve yapılandırılmış verisi akışla geliyor.** Bilinmeyen bir kullanıcı adı `404`, kanonik olmayan bir giriş adı `308` yanıtlıyor; çünkü ikisi de yanıt gövdesi başlamadan karar veriliyor. Bu da repoya bakışın kendi `<Suspense>` sınırının arkasında çalışması demek. Kişi, header ve footer ilk pakette; altı repo, öne çıkan diller ve bunları anlatan `ProfilePage` veri bloğu son pakette geliyor. JavaScript çalıştıran bir tarayıcı bitmiş paftayı görüyor; ilk pakette duran bir istemci ise projeler olmadan kişiyi görüyor.
- **Tema üçüncü bir durum değil.** Geçiş düğmesi yalnızca gece (varsayılan) ve kâğıt sunuyor. "Sistem" modu yok ve sunucu her zaman gece paletini çiziyor — saklanan tema, ilk boyamadan önce küçük bir satır içi betikle uygulanıyor, böylece sayfa yanlış temayı flaş etmiyor. Görünen tek sonuç tarayıcı çerçevesi: sunucunun render ettiği `<meta name="theme-color">` koyu değer ve istemci onu yeniden boyuyor, bu yüzden kâğıt temasındaki bir ziyaretçi adres çubuğunu bir an koyu görebilir.
- **API rotası yok.** Her şey bir sayfa ya da bir metadata rotası; önbellek de framework'ün kendi önbelleği: repo listesi bir saat, sabitlenmiş liste on dakika, sosyal kart bir dakika, sayfaların kendisi ise statik. Token, herkese açık bir dağıtımı anonim rate limit'in altında tutan şeydir.
- **404 gövdesi istemcide hydrate ediliyor.** Durum, lokalize `<title>` ve `noindex` meta verisi ilk HTML'de doğru, ancak görünür işaretleme RSC payload'ı üzerinden geliyor; çünkü `notFound()` `NEXT_HTTP_ERROR_FALLBACK;404` fırlatarak çalışıyor.
- **Çevrimdışı destek yok.** Web uygulaması manifesti yüklenebilirlik meta verisi sağlıyor, ancak çevrimdışı kullanım için hiçbir şey önbelleklenmiyor.

## Lisans

MIT — bkz. [`LICENSE`](LICENSE).
