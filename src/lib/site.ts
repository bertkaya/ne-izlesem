// Canlı adres: NEXT_PUBLIC_SITE_URL (özel alan adı) ya da Vercel'in otomatik verdiği üretim adresi
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
