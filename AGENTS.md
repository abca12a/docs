# Documentation project instructions

## About this project

- This is the DimiLinks API documentation site built on Mintlify.
- Pages are MDX files with YAML frontmatter.
- Configuration lives in `docs.json`.
- Run `mint dev` to preview locally when Mintlify CLI is available.
- Run `mint broken-links` before publishing when Mintlify CLI is available.

## Style preferences

- Use Simplified Chinese for primary content.
- Use active voice and concise sentences.
- Use second person when guiding developers.
- Use code formatting for API paths, parameters, commands, file names, and environment variables.
- Keep endpoint pages focused on one developer task: request, response, parameters, and next step.

## Content boundaries

- Document public API behavior only.
- Do not include internal server credentials, admin-only operations, or private infrastructure details.
- Do not tell users to put API Keys in browsers or public client bundles.
