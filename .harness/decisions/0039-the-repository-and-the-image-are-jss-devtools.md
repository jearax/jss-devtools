---
id: 0039
title: the repository and the image are jss-devtools
status: accepted
date: 2026-11-04
supersedes: 0010, 0013
---

# 0039 The repository and the image are jss-devtools

## Context

The repository was created as `jearax/jss-devtools2` ([0010](./0010-github-remote.md)), because the
rewrite was not a continuation of the old `jss-devtools` repository. It was later renamed to
`jearax/jss-devtools`, and the old name kept answering as a redirect.

Two things followed from the rename, and neither was updated:

- The site linked to the old name, so every link on the site went through a redirect.
- The image was published as `ghcr.io/jearax/jss-devtools2`, while CI tags the image with
  `${{ github.repository }}`, which is the canonical name. The old package name still answered, but
  with a different digest: the two names are two different images, and the site was being deployed
  from the older one.

The evidence, checked on 2026-11-04:

- The CI run of `a77ab7e` pushed `ghcr.io/jearax/jss-devtools:latest`.
- An anonymous pull of both names answers 200, with different digests: `jss-devtools` is `1adbff49…`
  and `jss-devtools2` is `c84f0389…`.
- The live page serves no React bundle, so production is still running the old image.

## Decision

**The repository is `jearax/jss-devtools`, and the image is `ghcr.io/jearax/jss-devtools`.**

- The site's links point at the canonical name, from one constant.
- `docker/docker-compose.yml` pulls `ghcr.io/jearax/jss-devtools:latest`.
- The deployment guide names the canonical package, the canonical Git URL and the canonical tag.
- The CI workflow is not changed: it already tags with `${{ github.repository }}`.

## In the user's words

> "Dùng tên mới (Recommended)" (user, 2026-11-04), choosing the recommended option.

## Consequences

- The old package name still resolves, and still answers with an older image. Anything that pulls
  it keeps running the old site until it is changed.
- The Dokploy service's Git URL should point at the canonical repository. GitHub redirects the old
  name, so the service keeps working either way, but the canonical name is the one that survives a
  rename.
- The decisions that named the old repository are kept: they record what was decided then. This
  record supersedes them.
