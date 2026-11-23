# Contributing to Virtual Physics Lab

Thanks for your interest! Small, focused contributions are the easiest to review.

## Getting started

1. Fork the repo and create a branch: `git checkout -b feat/short-description`.
2. Install and run the checks:

   ```bash
   npm run typecheck && npm test
   ```

3. Keep each pull request to one logical change, with a clear commit message
   (for example `fix: correct X`, `docs: update setup`, `feat: add Y`).

## Guidelines

- Do not commit secrets, `.env` files, API keys or personal data. Use `.env.example` for new variables.
- Do not commit generated build output or `node_modules` unless the project requires it.
- Match the existing code style and naming. Add or update tests for behaviour you change.
- Describe *what* changed and *why* in the pull request. Link related issues.

## Reporting bugs and ideas

Open an issue using the templates in `.github/ISSUE_TEMPLATE/`. For security problems, see [SECURITY.md](SECURITY.md) — do **not** open a public issue.

By contributing you agree that your contribution may be licensed under the same terms as this repository, once the maintainer has chosen them (see the README *License* section).
