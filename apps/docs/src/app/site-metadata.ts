interface SitePage {
  title: string;
  description: string;
  canonical: string;
  agent: string;
}

let pages: Promise<Record<string, SitePage>> | undefined;

export async function syncSiteMetadata(pathname: string) {
  pages ??= fetch('/site-meta.json').then(async (response) => {
    if (!response.ok) throw new Error(`Site metadata: ${response.status}`);
    return response.json() as Promise<Record<string, SitePage>>;
  });
  try {
    const page = (await pages)[pathname.replace(/\/$/, '') || '/'];
    if (!page || window.location.pathname !== pathname) return;
    document.title = page.title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', page.description);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', page.title);
    document.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.setAttribute('content', pathname === '/' ? 'website' : 'article');
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', page.description);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', page.canonical);
    document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', page.title);
    document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', page.description);
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', page.canonical);
    document.querySelector<HTMLLinkElement>('link[rel="alternate"][type="text/markdown"]')?.setAttribute('href', page.agent);
    const schema = pathname === '/' ? {
      '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: 'MetalUI', description: page.description,
      url: 'https://metalui.dev', codeRepository: 'https://github.com/vijayksingh/metalui',
      programmingLanguage: ['TypeScript', 'Swift'], license: 'https://opensource.org/license/mit',
    } : {
      '@context': 'https://schema.org', '@type': 'TechArticle', headline: page.title.replace(/ — MetalUI$/, ''),
      description: page.description, url: page.canonical,
      isPartOf: { '@type': 'WebSite', name: 'MetalUI', url: 'https://metalui.dev' },
    };
    const structuredData = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (structuredData) structuredData.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
  } catch {
    pages = undefined;
  }
}
