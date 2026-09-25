import type { ExampleDescriptionKey } from './examples';

/**
 * Single source of truth for the version advertised in the UI badge. It mirrors
 * `package.json#version` and is asserted against it by `tests/lib/i18n.test.ts`
 * rather than imported, because importing package.json would pull the whole
 * manifest into the client bundle.
 */
export const APP_VERSION = '0.1.0';

export const LOCALES = ['tr', 'en', 'de', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'tr';

export const LOCALE_LABELS: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
};

export const LOCALE_TAGS: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
};

export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  tr: 'tr_TR',
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
};

export type SearchParams = Record<string, string | string[] | undefined>;

const turkish = {
  localeSwitcher: {
    label: 'Dil seçin',
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
    heroBefore: 'GitHub kullanıcı adını yaz, saniyeler içinde sade ve yazdırılabilir bir ',
    heroHighlight: 'geliştirici portföyü',
    heroAfter: ' oluşsun.',
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
      torvalds: 'Linux yaratıcısı',
      gaearon: 'Full-stack geliştirici',
      yyx990803: 'Vue.js yaratıcısı',
    } satisfies Record<ExampleDescriptionKey, string>,
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
    avatarTitle: 'GitHub profil bağlantısı',
    followers: 'Takipçi',
    following: 'Takip',
    repositories: 'Repo',
    email: 'E-posta',
    blog: 'Blog',
    featuredLanguages: 'Öne çıkan repo dilleri',
    topThree: 'TOP 3',
    topLanguages: 'En çok görülen 3 dil',
    languagePercent: (name: string, percent: number) => `${name} yüzde ${percent}`,
    footer: 'Git-to-Portfolio ile oluşturuldu · Veriler GitHub API’den alınır',
  },
  repositories: {
    unavailableTitle: 'Projeler şu anda yüklenemedi.',
    unavailableDescription: 'GitHub verileri alınırken geçici bir sorun oluştu. Birkaç dakika sonra tekrar dene.',
    emptyTitle: 'Gösterilecek repo yok.',
    emptyDescription: 'Bu kullanıcının herkese açık reposu bulunamadı.',
    projectsLabel: 'Projeler',
    title: 'Öne çıkan repolar',
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
  error: {
    label: 'Git-to-Portfolio',
    title: 'Bir hata oluştu',
    description: 'GitHub verileri alınırken geçici bir sorun oluştu. Lütfen kısa süre sonra tekrar deneyin.',
    retry: 'Tekrar dene',
    home: 'Ana sayfa',
  },
  metadata: {
    userNotFoundTitle: 'Kullanıcı bulunamadı',
    homeTitle: 'Git-to-Portfolio',
    homeDescription: 'GitHub profilinden otomatik, sade ve yazdırılabilir bir geliştirici portföyü oluştur.',
    portfolioDescription: (name: string) => `${name} kullanıcısının GitHub portföyü, öne çıkan projeleri ve repo dilleri.`,
    portfolioTitle: (name: string) => `${name} | GitHub portföyü`,
  },
};

export type Dictionary = typeof turkish;

export const dictionaries: Record<Locale, Dictionary> = {
  tr: turkish,
  en: {
    localeSwitcher: {
      label: 'Select language',
    },
    header: {
      homeLabel: 'Git-to-Portfolio home',
      documentation: 'Documentation',
    },
    search: {
      formLabel: 'Create a GitHub portfolio',
      inputLabel: 'GitHub username',
      placeholder: 'GitHub username... (e.g. torvalds)',
      invalidUsername: 'Enter a valid GitHub username or github.com profile URL.',
      emptyUsername: 'GitHub username is required.',
      creating: 'Creating…',
      create: 'Create',
      examples: 'Examples:',
    },
    home: {
      badge: `v${APP_VERSION} — Portfolio from GitHub`,
      heroBefore: 'Enter a GitHub username and instantly create a clean, printable ',
      heroHighlight: 'developer portfolio',
      heroAfter: '.',
      howLabel: 'How it works',
      howTitle: 'Your portfolio in three steps',
      howDescription: 'No complex setup and no account required. All you need is a username.',
      steps: [
        {
          title: 'Enter a username',
          text: 'Type a GitHub username in the box above. We will fetch the profile automatically.',
        },
        {
          title: 'View the portfolio',
          text: 'The avatar, bio, most-starred projects and featured repository languages are listed automatically.',
        },
        {
          title: 'Print or save as PDF',
          text: 'Print the page or save it as a PDF, ready for your next job application.',
        },
      ],
      tryLabel: 'Try it now',
      profilesTitle: 'Popular profiles',
      profilesDescription: 'Explore real portfolios with one click.',
      liveExamples: 'Live examples',
      exampleDescriptions: {
        torvalds: 'Creator of Linux',
        gaearon: 'Full-stack developer',
        yyx990803: 'Creator of Vue.js',
      },
      howLink: 'How it works',
      source: 'Source',
      copyright: (year: number) => `© ${year} Git-to-Portfolio.`,
    },
    profile: {
      home: 'Home',
      profileOf: 'Profile /',
      portfolioTitle: 'GitHub portfolio',
      developerProfile: 'Developer profile',
      avatarAlt: 'avatar',
      avatarTitle: 'GitHub profile link',
      followers: 'Followers',
      following: 'Following',
      repositories: 'Repos',
      email: 'Email',
      blog: 'Blog',
      featuredLanguages: 'Featured repository languages',
      topThree: 'TOP 3',
      topLanguages: 'Top 3 languages',
      languagePercent: (name, percent) => `${name}, ${percent} percent`,
      footer: 'Created with Git-to-Portfolio · Data from the GitHub API',
    },
    repositories: {
      unavailableTitle: 'Projects could not be loaded right now.',
      unavailableDescription: 'There was a temporary problem reaching GitHub. Please try again in a few minutes.',
      emptyTitle: 'No repositories to show.',
      emptyDescription: 'No public repositories were found for this user.',
      projectsLabel: 'Projects',
      title: 'Featured repositories',
      projectCount: (count) => `${count} PROJECTS`,
      missingDescription: 'No description is available for this project.',
      stars: 'Stars',
      forks: 'Forks',
    },
    print: {
      label: 'Print / Save as PDF',
    },
    share: {
      label: 'Share',
      copied: 'Link copied to clipboard.',
      shared: 'Portfolio shared.',
      copyError: 'The link could not be copied. Copy it from the address bar instead.',
      shareError: 'The share sheet could not be opened. Copy the link from the address bar instead.',
      dismiss: 'Dismiss notification',
    },
    notFound: {
      pageLabel: 'Page not found',
      pageTitle: 'The page you requested does not exist',
      pageDescription: 'The page may have moved or never existed. Return home and try again.',
      userLabel: 'Profile not found',
      userTitle: 'User not found',
      userDescription: 'The GitHub user you requested could not be found. Check the username and try again.',
      backHome: 'Back to home',
    },
    error: {
      label: 'Git-to-Portfolio',
      title: 'Something went wrong',
      description: 'There was a temporary problem loading GitHub data. Please try again shortly.',
      retry: 'Try again',
      home: 'Home',
    },
    metadata: {
      userNotFoundTitle: 'User not found',
      homeTitle: 'Git-to-Portfolio',
      homeDescription: 'Create a simple, printable developer portfolio automatically from a GitHub profile.',
      portfolioDescription: (name) => `GitHub portfolio for ${name}, featuring highlighted projects and repository languages.`,
      portfolioTitle: (name) => `${name} | GitHub portfolio`,
    },
  },
  de: {
    localeSwitcher: {
      label: 'Sprache auswählen',
    },
    header: {
      homeLabel: 'Git-to-Portfolio Startseite',
      documentation: 'Dokumentation',
    },
    search: {
      formLabel: 'GitHub-Portfolio erstellen',
      inputLabel: 'GitHub-Benutzername',
      placeholder: 'GitHub-Benutzername... (z. B. torvalds)',
      invalidUsername: 'Gib einen gültigen GitHub-Benutzernamen oder eine github.com-Profiladresse ein.',
      emptyUsername: 'Der GitHub-Benutzername darf nicht leer sein.',
      creating: 'Wird erstellt…',
      create: 'Erstellen',
      examples: 'Beispiele:',
    },
    home: {
      badge: `v${APP_VERSION} — Portfolio aus GitHub`,
      heroBefore: 'Gib einen GitHub-Benutzernamen ein und erstelle in Sekunden ein sauberes, druckbares ',
      heroHighlight: 'Entwicklerportfolio',
      heroAfter: '.',
      howLabel: 'So funktioniert’s',
      howTitle: 'Portfolio in drei Schritten',
      howDescription: 'Keine komplexe Einrichtung und kein Konto nötig. Der Benutzername genügt.',
      steps: [
        {
          title: 'Benutzernamen eingeben',
          text: 'Gib oben einen GitHub-Benutzernamen ein. Das Profil wird automatisch geladen.',
        },
        {
          title: 'Portfolio ansehen',
          text: 'Avatar, Bio, die meistgenutzen Projekte und die Sprachen der ausgewählten Repositories werden automatisch angezeigt.',
        },
        {
          title: 'Drucken oder als PDF speichern',
          text: 'Drucke die Seite oder speichere sie als PDF – bereit für deine nächste Bewerbung.',
        },
      ],
      tryLabel: 'Jetzt ausprobieren',
      profilesTitle: 'Beliebte Profile',
      profilesDescription: 'Entdecke echte Portfolios mit einem Klick.',
      liveExamples: 'Live-Beispiele',
      exampleDescriptions: {
        torvalds: 'Schöpfer von Linux',
        gaearon: 'Full-Stack-Entwickler',
        yyx990803: 'Schöpfer von Vue.js',
      },
      howLink: 'So funktioniert’s',
      source: 'Quellcode',
      copyright: (year: number) => `© ${year} Git-to-Portfolio.`,
    },
    profile: {
      home: 'Startseite',
      profileOf: 'Profil /',
      portfolioTitle: 'GitHub-Portfolio',
      developerProfile: 'Entwicklerprofil',
      avatarAlt: 'Profilbild',
      avatarTitle: 'Link zum GitHub-Profil',
      followers: 'Follower',
      following: 'Folgt',
      repositories: 'Repos',
      email: 'E-Mail',
      blog: 'Blog',
      featuredLanguages: 'Sprachen der ausgewählten Repositories',
      topThree: 'TOP 3',
      topLanguages: 'Top 3 Sprachen',
      languagePercent: (name, percent) => `${name}, ${percent} Prozent`,
      footer: 'Erstellt mit Git-to-Portfolio · Daten von der GitHub API',
    },
    repositories: {
      unavailableTitle: 'Projekte konnten gerade nicht geladen werden.',
      unavailableDescription: 'Beim Abrufen von GitHub-Daten ist ein vorübergehendes Problem aufgetreten. Bitte in wenigen Minuten erneut versuchen.',
      emptyTitle: 'Keine Repositories vorhanden.',
      emptyDescription: 'Für dieses Benutzerkonto wurden keine öffentlichen Repositories gefunden.',
      projectsLabel: 'Projekte',
      title: 'Ausgewählte Repositories',
      projectCount: (count) => `${count} PROJEKTE`,
      missingDescription: 'Für dieses Projekt ist keine Beschreibung verfügbar.',
      stars: 'Sterne',
      forks: 'Forks',
    },
    print: {
      label: 'Drucken / Als PDF speichern',
    },
    share: {
      label: 'Teilen',
      copied: 'Link in die Zwischenablage kopiert.',
      shared: 'Portfolio geteilt.',
      copyError: 'Der Link konnte nicht kopiert werden. Kopiere ihn stattdessen aus der Adressleiste.',
      shareError: 'Das Freigabemenü konnte nicht geöffnet werden. Kopiere den Link stattdessen aus der Adressleiste.',
      dismiss: 'Hinweis schließen',
    },
    notFound: {
      pageLabel: 'Seite nicht gefunden',
      pageTitle: 'Die gewünschte Seite gibt es nicht',
      pageDescription: 'Die Seite wurde möglicherweise verschoben oder hat nie existiert. Kehre zur Startseite zurück und versuche es erneut.',
      userLabel: 'Profil nicht gefunden',
      userTitle: 'Benutzer nicht gefunden',
      userDescription: 'Der gesuchte GitHub-Benutzer wurde nicht gefunden. Prüfe den Benutzernamen und versuche es erneut.',
      backHome: 'Zurück zur Startseite',
    },
    error: {
      label: 'Git-to-Portfolio',
      title: 'Ein Fehler ist aufgetreten',
      description: 'Beim Laden der GitHub-Daten ist ein vorübergehendes Problem aufgetreten. Bitte versuche es gleich noch einmal.',
      retry: 'Erneut versuchen',
      home: 'Startseite',
    },
    metadata: {
      userNotFoundTitle: 'Benutzer nicht gefunden',
      homeTitle: 'Git-to-Portfolio',
      homeDescription: 'Erstelle automatisch ein einfaches, druckbares Entwicklerportfolio aus einem GitHub-Profil.',
      portfolioDescription: (name) => `GitHub-Portfolio von ${name} mit ausgewählten Projekten und Repository-Sprachen.`,
      portfolioTitle: (name) => `${name} | GitHub-Portfolio`,
    },
  },
  es: {
    localeSwitcher: {
      label: 'Seleccionar idioma',
    },
    header: {
      homeLabel: 'Inicio de Git-to-Portfolio',
      documentation: 'Documentación',
    },
    search: {
      formLabel: 'Crear un portfolio de GitHub',
      inputLabel: 'Nombre de usuario de GitHub',
      placeholder: 'Nombre de usuario de GitHub... (ej. torvalds)',
      invalidUsername: 'Introduce un nombre de usuario de GitHub válido o la URL de un perfil de github.com.',
      emptyUsername: 'El nombre de usuario de GitHub es obligatorio.',
      creating: 'Creando…',
      create: 'Crear',
      examples: 'Ejemplos:',
    },
    home: {
      badge: `v${APP_VERSION} — Portfolio desde GitHub`,
      heroBefore: 'Escribe un nombre de usuario de GitHub y crea al instante un ',
      heroHighlight: 'portfolio de desarrollador',
      heroAfter: ' limpio e imprimible.',
      howLabel: 'Cómo funciona',
      howTitle: 'Tu portfolio en tres pasos',
      howDescription: 'Sin configuración compleja ni cuentas. Solo necesitas un nombre de usuario.',
      steps: [
        {
          title: 'Escribe un nombre de usuario',
          text: 'Introduce un nombre de usuario de GitHub en el cuadro superior. Cargaremos el perfil automáticamente.',
        },
        {
          title: 'Explora el portfolio',
          text: 'El avatar, la bio, los proyectos más destacados y los lenguajes de los repositorios se muestran automáticamente.',
        },
        {
          title: 'Imprime o guarda en PDF',
          text: 'Imprime la página o guárdala en PDF, lista para tu próxima candidatura.',
        },
      ],
      tryLabel: 'Pruébalo ahora',
      profilesTitle: 'Perfiles populares',
      profilesDescription: 'Explora portfolios reales con un clic.',
      liveExamples: 'Ejemplos en vivo',
      exampleDescriptions: {
        torvalds: 'Creador de Linux',
        gaearon: 'Desarrollador full-stack',
        yyx990803: 'Creador de Vue.js',
      },
      howLink: 'Cómo funciona',
      source: 'Código fuente',
      copyright: (year: number) => `© ${year} Git-to-Portfolio.`,
    },
    profile: {
      home: 'Inicio',
      profileOf: 'Perfil /',
      portfolioTitle: 'Portfolio de GitHub',
      developerProfile: 'Perfil de desarrollador',
      avatarAlt: 'avatar',
      avatarTitle: 'Enlace al perfil de GitHub',
      followers: 'Seguidores',
      following: 'Siguiendo',
      repositories: 'Repos',
      email: 'Correo',
      blog: 'Blog',
      featuredLanguages: 'Lenguajes destacados',
      topThree: 'TOP 3',
      topLanguages: '3 lenguajes principales',
      languagePercent: (name, percent) => `${name}, ${percent} por ciento`,
      footer: 'Creado con Git-to-Portfolio · Datos de la API de GitHub',
    },
    repositories: {
      unavailableTitle: 'No se pudieron cargar los proyectos.',
      unavailableDescription: 'Hubo un problema temporal al conectar con GitHub. Inténtalo de nuevo en unos minutos.',
      emptyTitle: 'No hay repositorios para mostrar.',
      emptyDescription: 'No se encontraron repositorios públicos para este usuario.',
      projectsLabel: 'Proyectos',
      title: 'Repositorios destacados',
      projectCount: (count) => `${count} PROYECTOS`,
      missingDescription: 'No hay una descripción disponible para este proyecto.',
      stars: 'Estrellas',
      forks: 'Bifurcaciones',
    },
    print: {
      label: 'Imprimir / Guardar en PDF',
    },
    share: {
      label: 'Compartir',
      copied: 'Enlace copiado al portapapeles.',
      shared: 'Portfolio compartido.',
      copyError: 'No se pudo copiar el enlace. Cópialo de la barra de direcciones.',
      shareError: 'No se pudo abrir el menú de compartir. Copia el enlace de la barra de direcciones.',
      dismiss: 'Descartar la notificación',
    },
    notFound: {
      pageLabel: 'Página no encontrada',
      pageTitle: 'La página que buscas no existe',
      pageDescription: 'Puede que la página se haya movido o nunca haya existido. Vuelve al inicio e inténtalo de nuevo.',
      userLabel: 'Perfil no encontrado',
      userTitle: 'Usuario no encontrado',
      userDescription: 'No se encontró el usuario de GitHub solicitado. Comprueba el nombre e inténtalo de nuevo.',
      backHome: 'Volver al inicio',
    },
    error: {
      label: 'Git-to-Portfolio',
      title: 'Se produjo un error',
      description: 'Hubo un problema temporal al cargar los datos de GitHub. Inténtalo de nuevo en unos instantes.',
      retry: 'Reintentar',
      home: 'Inicio',
    },
    metadata: {
      userNotFoundTitle: 'Usuario no encontrado',
      homeTitle: 'Git-to-Portfolio',
      homeDescription: 'Crea automáticamente un portfolio de desarrollador sencillo e imprimible a partir de un perfil de GitHub.',
      portfolioDescription: (name) => `Portfolio de GitHub de ${name}, con proyectos destacados y lenguajes de repositorios.`,
      portfolioTitle: (name) => `${name} | Portfolio de GitHub`,
    },
  },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale);
}

export function getLocale(searchParams: SearchParams | null | undefined): Locale {
  const value = searchParams?.lang;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Converts the array returned by URLSearchParams#getAll() to the same shape
 * Next.js provides to Server Components. A single value remains a string;
 * repeated values stay an array and therefore follow getLocale()'s safe
 * fallback behavior.
 */
export function getLocaleFromQueryValues(values: readonly string[]): Locale {
  return getLocale({
    lang: values.length === 1 ? values[0] : [...values],
  });
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

function toSearchParams(search: string | SearchParams | null | undefined): URLSearchParams {
  if (typeof search === 'string') return new URLSearchParams(search);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

export function withLocale(
  pathname: string,
  locale: Locale,
  search: string | SearchParams | null | undefined = '',
  hash = '',
): string {
  const safePathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const params = toSearchParams(search);

  // The default locale is represented by the clean URL. Removing every lang
  // value also canonicalizes repeated keys supplied by an incoming request.
  params.delete('lang');
  if (locale !== DEFAULT_LOCALE) params.set('lang', locale);

  const query = params.toString();
  return `${safePathname}${query ? `?${query}` : ''}${hash}`;
}

/**
 * Returns the stable file-based metadata image path for a profile. Profile OG
 * images intentionally do not include the locale query because this route is
 * language-independent and social crawlers may omit page search parameters.
 */
export function getProfileOpenGraphImagePath(username: string): string {
  return `/${encodeURIComponent(username)}/opengraph-image`;
}

/**
 * Returns the hreflang targets for a localized pathname.
 * Values are relative so callers can either resolve them with Metadata API's
 * metadataBase or make them absolute themselves.
 */
export function getLocaleAlternates(pathname: string): Record<string, string> {
  return {
    ...Object.fromEntries(
      LOCALES.map((locale) => [LOCALE_TAGS[locale], withLocale(pathname, locale)])
    ),
    'x-default': withLocale(pathname, DEFAULT_LOCALE),
  };
}
