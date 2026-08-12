import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nova Marketing CRM',
    short_name: 'Nova CRM',
    description: 'Gestión y control de clientes de Nova Marketing',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e3a8a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
