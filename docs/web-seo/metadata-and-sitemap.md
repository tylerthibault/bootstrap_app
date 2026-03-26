# Metadata and Sitemap

## Metadata

Metadata is declared in `apps/web-seo/app/layout.tsx` using Next.js `Metadata`.

## Robots

`apps/web-seo/app/robots.ts` defines robots directives and points crawlers to the sitemap.

## Sitemap

`apps/web-seo/app/sitemap.ts` exposes the core public routes:

- `/`
- `/features`
- `/docs`
- `/privacy`
- `/terms`

Update the base URL when deployment domains are finalized.
