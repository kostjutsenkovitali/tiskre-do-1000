module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://tiskre-do.eu',
  generateRobotsTxt: true,
  exclude: ['/server-sitemap.xml'],
  transform: async (config, url) => {
    return {
      loc: url,
      changefreq: 'weekly',
      priority: url === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
      alternateRefs: [
        { href: `${config.siteUrl}/en`, hreflang: 'en' },
        { href: `${config.siteUrl}/et`, hreflang: 'et' },
        { href: `${config.siteUrl}/de`, hreflang: 'de' },
        { href: `${config.siteUrl}/fi`, hreflang: 'fi' },
        { href: `${config.siteUrl}/sv`, hreflang: 'sv' },
        { href: `${config.siteUrl}/fr`, hreflang: 'fr' },
      ],
    };
  },
};
