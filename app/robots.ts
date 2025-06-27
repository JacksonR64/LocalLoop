import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localloopevents.xyz'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/auth/callback',
                    '/auth/google/callback',
                    '/_next/',
                    '/static/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
} 