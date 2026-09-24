# Git-to-Portfolio - 3.5 Saatlik Plan

> Tarihsel plan notu: Uygulama client-side fetch yerine server-side fetch + on-demand ISR kullanır; güncel mimari ve komutlar için `README.md` dosyasına bakın.

## 1. Scope - VAR / YOK
VAR:
- `/[username]` sayfasi: avatar, bio, top 3 dil, son 6 repo (star'a gore sirali), iletisim linkleri
- Username input ana sayfasi
- Print CSS ile PDF CV indir butonu

YOK:
- Auth, DB, dashboard, tema secimi, contribution grafigi (GraphQL zaman alir), Vercel deploy butonu

## 2. Stack
Next.js App Router + Tailwind + Vercel. DB yok, hepsi client-side fetch + cache.

Dosya yapisi:
```
app/page.tsx -> username input
app/[username]/page.tsx -> portfolyo
lib/github.ts -> API fonksiyonlari
lib/skills.ts -> dil hesaplama
components/ProfileCard.tsx / RepoGrid.tsx
```

## 3. Zaman Plani

### 0:00-0:30 Kurulum
Vibe prompt: `Next.js + Tailwind ile tek temali, dark mode, responsive portfolio template olustur. shadcn kullanma.`
Vercel'e bos deploy et, linki al.

### 0:30-1:30 GitHub API
`lib/github.ts`:
- `GET /users/:u` + `GET /users/:u/repos?sort=updated&per_page=100`
- Token'siz (60 req/saat yeterli), `fetch` + `next: {revalidate: 3600}`
- Dil hesabi: repo `language` say, yuzdele.

Vibe prompt: `github.ts yaz: getProfile(username) ve getTopRepos(username) fonksiyonlari olsun, hata ve rate-limit handling ekle.`

### 1:30-2:30 UI
`/[username]` sayfasi: ustte ProfileCard, altta 6'li RepoGrid (isim, aciklama, star, fork, dil, updated).
Ana sayfa: buyuk input + `github.com/username` ornekleri + 3 ornek link.

### 2:30-3:00 PDF
`Print` butonu: `window.print()` + `@media print` CSS ile menuyu gizle. Ekstra kutuphane kurma.

### 3:00-3:30 Star Paketi
- Ingilizce README: demo GIF (20 sn), `Deploy Your Own` butonu, `Try: /kaan /torvalds` linkleri
- `og-image`: Vercel OG ile `/[username]` icin otomatik kapak
- Repo ismi: `git-to-portfolio` + Topics: `nextjs, portfolio-generator, github-api, hacktoberfest`

## 4. Bitirme Kriteri
`site.com/torvalds` aciliyor, print ile PDF aliniyor, README'de GIF + demo var -> bitir, paylas.
