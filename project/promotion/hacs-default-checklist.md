# HACS Default Repository Checklist

Goal: prepare TopoMation for a future PR to `hacs/default` so users can find it directly in HACS instead of adding a custom repository.

## Current status

- Public GitHub repository: done.
- GitHub Issues enabled: done.
- Repository description: done.
- Repository topics: done.
- GitHub releases: done.
- HACS Action in CI: done.
- Hassfest in CI: done.
- HACS validation currently ignores `brands` only.

## Remaining before submitting

1. Resolve the brand check.
   - HACS default review checks for a brand asset or matching entry in `home-assistant/brands`.
   - The current CI intentionally ignores `brands` until that requirement is handled properly.

2. Make HACS Action pass without ignores.
   - Remove `ignore: "brands"` from `.github/workflows/frontend-tests.yml`.
   - Remove `ignore: "brands"` from `.github/workflows/auto-release.yml`.
   - Confirm the full CI run passes.

3. Publish a release after the no-ignore HACS/Hassfest checks pass.
   - HACS default docs require a real GitHub release, not just a tag.
   - If the change is metadata/docs only, decide whether to publish a patch release specifically for HACS default readiness.

4. Submit a PR to `hacs/default`.
   - Add the repository alphabetically under the `integration` list.
   - Fill the PR template carefully.
   - Expect review to take time.

## Optional cleanup before submitting

- Add a My Home Assistant HACS custom repository link to the README.
- Add a very short demo carousel or GIF near the README top.
- Confirm the README first screen explains beta status without making the project feel too risky to try.
- Consider enabling GitHub Discussions only if there is enough bandwidth to monitor them.

