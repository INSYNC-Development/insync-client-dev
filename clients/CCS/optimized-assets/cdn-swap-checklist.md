# CDN swap checklist — CCS GmbH

SOP Phase 5. One row per **actual DOM position**, not per filename — the same asset can be embedded
twice (a lazy `data-src` copy and an eager `src` copy); swap both or half the traffic still hits the old host.

Base (fill after uploading to `40hstudio/asset` and pinning the commit):

```
CDN_BASE = https://cdn.jsdelivr.net/gh/40hstudio/asset@<full-commit-sha>/ccs-gmbh
```

## machine-reveal

Status: **not placed yet** — the sequence has no home in `site-mirror/` as of 2026-08-27.
Ciptaraka positions it in Webflow first; then fill the rows below and tick them off against the
*published* page, not the Designer.

| # | Page / section | Element | Old URL | New URL | Done |
|---|---|---|---|---|---|
| 1 | _(tbd)_ | `<canvas>` frame source | — (new asset) | `$CDN_BASE/sequences/machine-reveal/1440/machine-reveal-####.webp` | ☐ |
| 2 | _(tbd)_ | mobile tier | — | `$CDN_BASE/sequences/machine-reveal/720/machine-reveal-####.webp` | ☐ |
| 3 | _(tbd)_ | poster / first paint | — | `$CDN_BASE/posters/machine-reveal-poster.jpg` | ☐ |
| 4 | _(tbd)_ | `<video>` fallback (if used) | — | `$CDN_BASE/videos/machine-reveal.mp4` | ☐ |

## Verify (Phase 7, on the published site)

- [ ] `curl` the published HTML → zero `s3.amazonaws.com`, `player.vimeo.com`, or **unpinned** jsDelivr URLs.
- [ ] Every `<video>` (if the fallback is used) carries `poster`.
- [ ] Network panel: no image request > ~200 KB (largest frame here is 44 KB).
- [ ] Performance panel: full-page scroll shows no long task > 500 ms — decoding must finish in the preload gate, not mid-scroll.
- [ ] iPhone Safari on cellular: the reveal plays through, no black hold past frame 0001, scroll never hitches.
