# Deploy metalui.dev

The documentation site is hosted by the Cloudflare Pages project `metalui` in account `e3ae6e5dd1aac7f5d4c1d4aa45c00f83`. The production domain is `https://metalui.dev`; `https://www.metalui.dev` is also bound to the project. Cloudflare manages proxied CNAME records for both hostnames, pointing to `metalui.pages.dev`.

Pages is connected to `vijayksingh/metalui`. Pushing `main` deploys the docs automatically. Pull requests get preview deployments. This website deployment is independent of tagged npm publishing in `.github/workflows/publish.yml`.

| Pages setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | repository root |
| Build command | `npm ci && npm run build -w @metalui/docs` |
| Build output directory | `apps/docs/dist` |
| Build system | version 3 |
| Production build variable | `NODE_VERSION=24` |

The docs build takes the library's generated registry, icon SVGs, `AI.md`, and manifests from `packages/metalui/public` through Vite's `publicDir`. They must be present in the deployed output along with the app assets.

After Vite builds, `scripts/build-site-discovery.mjs` writes one static HTML file per route in the docs navigation, plus `sitemap.xml`, `robots.txt`, `site-meta.json`, and a real `404.html`. Cloudflare serves these HTML files at extensionless URLs. Each page has a canonical URL, its own description, crawlable content, and a Markdown agent-guide link. When adding a route, add it to both the router and navigation, then give it a description in the discovery script unless its component has a registry description. The build rejects missing descriptions or route mismatches. The component and icon agent files continue to come from `npm run generate`.

For manual recovery, use the same source commit as the deployment you intend to restore:

```sh
npm ci
npm run build -w @metalui/docs
npx wrangler pages deploy apps/docs/dist --project-name metalui --branch main --commit-hash <commit-sha> --commit-dirty=false
```

Verify the deployment URL first, then the normal visitor path. Check `/`, `/components/button`, `/icons`, `/r/button.json`, `/AI.md`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`, and an icon SVG on `https://metalui.dev`; an unknown path should return 404. Open the site in a browser and exercise navigation. DNS and certificate activation can lag behind a successful Pages deployment. A `pages.dev` response alone does not prove the custom domain works.
