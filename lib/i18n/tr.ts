import 'server-only';

import { APP_VERSION } from './consts';
import { ERROR_MESSAGES } from './error';
import type { Dictionary } from './types';

/**
 * The Turkish dictionary.
 *
 * Every language lives in its own module so a server render only ever loads
 * the one it needs. The `server-only` marker keeps the copy out of the browser
 * bundle: a Client Component that reaches for a dictionary fails the build
 * instead of quietly shipping four languages to every visitor.
 */
export const turkish: Dictionary = {
  localeSwitcher: {
    label: 'Dil seçin',
  },
  theme: {
    label: 'Tema',
    toNight: 'Gece moduna geç',
    toPaper: 'Gündüz moduna geç',
  },
  header: {
    homeLabel: 'Git-to-Portfolio ana sayfa',
    documentation: 'Dokümantasyon',
  },
  search: {
    formLabel: 'GitHub portföyü oluştur',
    inputLabel: 'GitHub kullanıcı adı',
    placeholder: 'GitHub kullanıcı adı... (örn. torvalds)',
    invalidUsername: 'Geçerli bir GitHub kullanıcı adı veya github.com profil adresi girin.',
    emptyUsername: 'GitHub kullanıcı adı boş olamaz.',
    creating: 'Oluşturuluyor…',
    create: 'Oluştur',
    examples: 'Örnekler:',
  },
  home: {
    badge: `v${APP_VERSION} — GitHub’dan portföy`,
    heroBefore: 'GitHub kullanıcı adını gir, ',
    heroHighlight: 'Git to Portfolio',
    heroAfter:
      ' ile saniyeler içinde ücretsiz, sade ve yazdırılabilir bir geliştirici portföyü ve CV oluştur.',
    howLabel: 'Nasıl çalışır?',
    howTitle: 'Üç adımda portföy',
    howDescription: 'Karmaşık kurulum yok, hesap oluşturmak yok. Sadece kullanıcı adın yeterli.',
    steps: [
      {
        title: 'Kullanıcı adını yaz',
        text: 'GitHub kullanıcı adını yukarıdaki kutuya gir. Profilin otomatik olarak çekilsin.',
      },
      {
        title: 'Portföyü gör',
        text: 'Avatar, bio, en çok yıldızlı projeler ve öne çıkan repoların dil dağılımı otomatik listelenir.',
      },
      {
        title: 'Yazdır veya PDF kaydet',
        text: 'Yazdır penceresinden çıktı al veya PDF olarak kaydet. İş başvurularına hazır.',
      },
    ],
    tryLabel: 'Hemen dene',
    profilesTitle: 'Popüler profiller',
    profilesDescription: 'Bir tıkla gerçek portföyleri incele.',
    liveExamples: 'Canlı örnekler',
    exampleDescriptions: {
      kcguner: 'Bu sitenin yaratıcısı',
      torvalds: 'Linux yaratıcısı',
    },
    howLink: 'Nasıl çalışır?',
    source: 'Kaynak',
    copyright: (year: number) => `© ${year} Git-to-Portfolio.`,
  },
  profile: {
    home: 'Ana sayfa',
    profileOf: 'Profil /',
    portfolioTitle: 'GitHub portföyü',
    developerProfile: 'Geliştirici profili',
    avatarAlt: 'avatar',
    profileLoading: 'Profil yükleniyor…',
    followers: 'Takipçi',
    following: 'Takip',
    repositories: 'Repo',
    email: 'E-posta',
    blog: 'Blog',
    featuredLanguages: 'Öne çıkan repo dilleri',
    topThree: 'TOP 3',
    topLanguages: 'En çok görülen 3 dil',
    // The percentage arrives already formatted for the locale by Intl
    // (`%60` in tr, `60%` in en, `60 %` in de/es), so each locale only decides
    // how the name and the value are joined in an aria-label.
    languagePercent: (name: string, formattedPercent: string) => `${name} ${formattedPercent}`,
    footer: 'Git-to-Portfolio ile oluşturuldu · Veriler GitHub API’den alınır',
  },
  repositories: {
    unavailableTitle: 'Projeler şu anda yüklenemedi.',
    unavailableDescription: 'GitHub verileri alınırken geçici bir sorun oluştu. Birkaç dakika sonra tekrar dene.',
    emptyTitle: 'Gösterilecek repo yok.',
    emptyDescription: 'Bu kullanıcının herkese açık reposu bulunamadı.',
    projectsLabel: 'Projeler',
    title: 'Öne çıkan repolar',
    pinnedTitle: 'Sabitlenmiş repolar',
    projectCount: (count: number) => `${count} PROJE`,
    missingDescription: 'Bu proje için açıklama bulunmuyor.',
    stars: 'Yıldız',
    forks: 'Fork',
  },
  print: {
    label: 'Yazdır / PDF’ye kaydet',
  },
  share: {
    label: 'Paylaş',
    copied: 'Bağlantı panoya kopyalandı.',
    shared: 'Portföy paylaşıldı.',
    copyError: 'Bağlantı kopyalanamadı. Adres çubuğundan bağlantıyı kopyalayabilirsiniz.',
    shareError: 'Paylaşım penceresi açılamadı. Adres çubuğundan bağlantıyı kopyalayabilirsiniz.',
    dismiss: 'Bildirimi kapat',
  },
  notFound: {
    pageLabel: 'Sayfa bulunamadı',
    pageTitle: 'Aradığın sayfa yok',
    pageDescription: 'Aradığın sayfa taşınmış veya hiç var olmamış olabilir. Ana sayfaya dönerek yeniden deneyebilirsin.',
    userLabel: 'Profil bulunamadı',
    userTitle: 'Kullanıcı bulunamadı',
    userDescription: 'Aradığın GitHub kullanıcısı bulunamadı. Kullanıcı adını kontrol edip tekrar dene.',
    backHome: 'Ana sayfaya dön',
  },
  error: ERROR_MESSAGES.tr,
  metadata: {
    userNotFoundTitle: 'Kullanıcı bulunamadı',
    homeTitle: 'Git to Portfolio — GitHub Portföy Sitesi ve CV Oluşturucu',
    homeDescription:
      'GitHub kullanıcı adını gir, Git to Portfolio ile saniyeler içinde sade, yazdırılabilir bir geliştirici portföyü oluştur. Ücretsiz, kurulum yok, hesap yok.',
    portfolioDescription: (name: string) => `${name} kullanıcısının GitHub portföyü, öne çıkan projeleri ve repo dilleri.`,
    portfolioTitle: (name: string) => `${name} | GitHub portföyü`,
    homeKeywords: [
      'git to portfolio',
      'git to portfolio github',
      'GitHub portföy',
      'GitHub portföy oluştur',
      'GitHub portföy sitesi',
      'GitHub profil portföy',
      'GitHub CV oluştur',
      'geliştirici CV',
      'yazdırılabilir CV',
      'PDF CV oluştur',
      'yazılımcı portföy sitesi',
    ],
    portfolioKeywords: (name: string) => [
      `${name} GitHub portföyü`,
      `${name} portföy`,
      `${name} GitHub projeleri`,
      `${name} projeleri`,
      'GitHub portföy',
      'geliştirici portföyü',
    ],
    ogImage: {
      alt: 'Git-to-Portfolio — GitHub profilinden yazdırılabilir portföy oluşturma',
      headline: 'GitHub’dan portföye.',
      subtitle: 'Kullanıcı adını yaz, saniyeler içinde sade ve yazdırılabilir bir geliştirici portföyü oluştur.',
      footer: 'GitHub profilinizi bir portföye dönüştürün.',
      badge: 'SEO ve paylaşım hazır',
    },
    profileOgImage: {
      alt: (name: string) => `${name} için GitHub portföyü`,
      label: 'GitHub portföyü',
      featured: 'Öne çıkan GitHub projeleri',
      share: 'GitHub profil paylaşımı',
      footer: 'Git-to-Portfolio ile oluşturuldu',
      unknownUser: 'GitHub kullanıcısı',
    },
  },
};
