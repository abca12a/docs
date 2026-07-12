# DimiLinks API Docs

This repository contains the Mintlify documentation site for DimiLinks API.

## Structure

- `docs.json`: Mintlify site configuration and navigation.
- `index.mdx`, `quickstart.mdx`, `api-reference/`: Simplified Chinese source and default routes.
- `en/`: Complete English documentation under `/en/*`.
- `jp/`: Complete Japanese documentation under `/jp/*`.
- `data/supported-models.json`: Verified production model snapshot used by examples.
- `api-reference/openapi.json`: Shared OpenAPI specification.

## Local preview

Install the Mintlify CLI when needed:

```bash
npm i -g mint
```

Preview the docs from the repository root:

```bash
mint dev
```

## Checks

Run these before publishing when Mintlify CLI is available:

```bash
node scripts/verify-docs.mjs
mint broken-links
```

At minimum, validate JSON files:

```bash
jq . docs.json >/dev/null
jq . api-reference/openapi.json >/dev/null
```

## Publishing

Mintlify deploys from the connected GitHub repository. Push changes to the default branch, then configure the custom domain in the Mintlify dashboard.
