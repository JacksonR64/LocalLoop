import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: "LocalLoop - Community Events Platform",
    short_name: "LocalLoop",
    description: "Discover and join local community events with seamless calendar integration",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en",
    categories: [
      "social",
      "lifestyle", 
      "productivity"
    ],
    icons: [
      {
        src: "/favicon-16x16.svg",
        sizes: "16x16",
        type: "image/svg+xml"
      },
      {
        src: "/favicon-32x32.svg",
        sizes: "32x32", 
        type: "image/svg+xml"
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}