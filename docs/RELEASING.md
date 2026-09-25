# Releasing MetalUI

MetalUI is an alpha package. React, icons and CSS publish to npm as `@unlocalhosted/metalui`; SwiftUI comes from the same public GitHub repository through Swift Package Manager. A `vX.Y.Z` tag triggers `.github/workflows/publish.yml` and must match the npm workspace version. The tag must point to a commit on `main`.

## First release

The first npm version cannot use trusted publishing: npm needs an existing package before its trusted publisher can be configured. An `@unlocalhosted` organization maintainer must sign in locally and publish the built package once.

```sh
npm ci
npm run build
npm run typecheck
npm run verify:package
npm whoami
npm publish --workspace @unlocalhosted/metalui --access public
```

Check the registry before tagging:

```sh
npm view @unlocalhosted/metalui@0.1.0 version
```

Then connect the npm package to GitHub Actions as a trusted publisher. In npm package settings, choose GitHub Actions, owner `vijayksingh`, repository `metalui`, workflow filename `publish.yml`, no environment, and allow `npm publish`. Alternatively, with npm CLI 11.15.0 or newer and an authenticated maintainer account:

```sh
npm trust github @unlocalhosted/metalui --repo vijayksingh/metalui --file publish.yml --allow-publish
```

After trusted publishing is active, restrict token-based publishing in npm package settings. A public GitHub repository is required for npm provenance. Tag the release commit and push the tag after the npm package is visible; the workflow verifies the release and skips a version already published by the first-release command.

## Later releases

Change only the npm workspace version, update `package-lock.json`, run the four checks above, and commit the release. Create and push an annotated `vX.Y.Z` tag from `main`. GitHub Actions builds, checks the tarball in a fresh consumer, and publishes through npm OIDC with provenance. Verify the version and provenance on npm before announcing the release. Do not reuse a published version number.

The browser feature suite remains a separate local check (`npm run test:e2e -- --workers=1`). It is not a release gate while existing docs fixtures are in progress. Known visual literal and recipe gaps are listed exactly in `scripts/lint-literals.allow.json` and `scripts/recipe-parity.allow.json`; the checks still reject new gaps.
