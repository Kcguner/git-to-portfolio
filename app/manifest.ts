import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // The installed app starts on the default language's home. The scope stays
    // the whole origin, because the app is a single surface with four
    // localized addresses, not four separate apps.
    id: '/tr',
    name: 'Git-to-Portfolio',
    short_name: 'Git-to-Portfolio',
    description:
      'Create a clean, shareable and printable developer portfolio from a public GitHub profile.',
    start_url: '/tr',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0c',
    theme_color: '#0a0a0c',
    categories: ['developer', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
