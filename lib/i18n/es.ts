import 'server-only';

import { APP_VERSION } from './consts';
import { ERROR_MESSAGES } from './error';
import type { Dictionary } from './types';

/**
 * The Spanish dictionary. See `lib/i18n/tr.ts` for why every language lives in
 * its own module.
 */
export const spanish: Dictionary = {
  localeSwitcher: {
    label: 'Seleccionar idioma',
  },
  theme: {
    label: 'Tema',
    toNight: 'Cambiar al tema nocturno',
    toPaper: 'Cambiar al tema de papel',
  },
  header: {
    homeLabel: 'Inicio de Git-to-Portfolio',
    documentation: 'Documentación',
  },
  search: {
    formLabel: 'Crear un portfolio de GitHub',
    inputLabel: 'Nombre de usuario de GitHub',
    placeholder: 'Nombre de usuario de GitHub... (ej. torvalds)',
    invalidUsername:
      'Introduce un nombre de usuario de GitHub válido o la URL de un perfil de github.com.',
    emptyUsername: 'El nombre de usuario de GitHub es obligatorio.',
    creating: 'Creando…',
    create: 'Crear',
    examples: 'Ejemplos:',
  },
  home: {
    badge: `v${APP_VERSION} — Portfolio desde GitHub`,
    heroBefore: 'Escribe un nombre de usuario de GitHub y obtén al instante un ',
    heroHighlight: 'Git to Portfolio',
    heroAfter:
      ' — portfolio de desarrollador gratuito, limpio e imprimible. Sin registro, en segundos.',
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
      kcguner: 'Creador de este sitio',
      torvalds: 'Creador de Linux',
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
    profileLoading: 'Cargando el perfil…',
    followers: 'Seguidores',
    following: 'Siguiendo',
    repositories: 'Repos',
    email: 'Correo',
    blog: 'Blog',
    featuredLanguages: 'Lenguajes destacados',
    topThree: 'TOP 3',
    topLanguages: '3 lenguajes principales',
    languagePercent: (name, formattedPercent) => `${name}, ${formattedPercent}`,
    footer: 'Creado con Git-to-Portfolio · Datos de la API de GitHub',
  },
  repositories: {
    unavailableTitle: 'No se pudieron cargar los proyectos.',
    unavailableDescription:
      'Hubo un problema temporal al conectar con GitHub. Inténtalo de nuevo en unos minutos.',
    emptyTitle: 'No hay repositorios para mostrar.',
    emptyDescription: 'No se encontraron repositorios públicos para este usuario.',
    projectsLabel: 'Proyectos',
    title: 'Repositorios destacados',
    pinnedTitle: 'Repositorios fijados',
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
    shareError:
      'No se pudo abrir el menú de compartir. Copia el enlace de la barra de direcciones.',
    dismiss: 'Descartar la notificación',
  },
  notFound: {
    pageLabel: 'Página no encontrada',
    pageTitle: 'La página que buscas no existe',
    pageDescription:
      'Puede que la página se haya movido o nunca haya existido. Vuelve al inicio e inténtalo de nuevo.',
    userLabel: 'Perfil no encontrado',
    userTitle: 'Usuario no encontrado',
    userDescription:
      'No se encontró el usuario de GitHub solicitado. Comprueba el nombre e inténtalo de nuevo.',
    backHome: 'Volver al inicio',
  },
  error: ERROR_MESSAGES.es,
  metadata: {
    userNotFoundTitle: 'Usuario no encontrado',
    homeTitle: 'Git to Portfolio — Generador de portfolio y CV desde GitHub',
    homeDescription:
      'Convierte un nombre de usuario de GitHub en un portfolio de desarrollador limpio e imprimible con Git to Portfolio. Gratis, sin registro, en segundos.',
    portfolioDescription: (name) =>
      `Portfolio de GitHub de ${name}, con proyectos destacados y lenguajes de repositorios.`,
    portfolioTitle: (name) => `${name} | Portfolio de GitHub`,
    homeKeywords: [
      'git to portfolio',
      'portfolio de GitHub',
      'crear portfolio de GitHub',
      'generador de portfolio de GitHub',
      'portfolio desde GitHub',
      'CV de desarrollador',
      'CV de GitHub',
      'currículo imprimible',
      'currículo en PDF',
      'portfolio de programador',
    ],
    portfolioKeywords: (name) => [
      `Portfolio de GitHub de ${name}`,
      `Portfolio de ${name}`,
      `Proyectos de GitHub de ${name}`,
      `Proyectos de ${name}`,
      'portfolio de GitHub',
      'portfolio de desarrollador',
    ],
    ogImage: {
      alt: 'Git-to-Portfolio — crea un portfolio imprimible a partir de un perfil de GitHub',
      headline: 'De GitHub a portfolio.',
      subtitle:
        'Escribe un nombre de usuario y crea al instante un portfolio de desarrollador limpio e imprimible.',
      footer: 'Convierte tu perfil de GitHub en un portfolio.',
      badge: 'SEO y para compartir listo',
    },
    profileOgImage: {
      alt: (name) => `Portfolio de GitHub de ${name}`,
      label: 'Portfolio de GitHub',
      featured: 'Proyectos destacados de GitHub',
      share: 'Perfil de GitHub para compartir',
      footer: 'Creado con Git-to-Portfolio',
      unknownUser: 'Usuario de GitHub',
    },
  },
};
