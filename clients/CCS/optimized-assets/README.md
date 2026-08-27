# Optimized assets — CCS GmbH

Produced per [[Webflow Asset Optimization & Performance Audit — SOP]] (Vault → `00 - Meta/Technical Guides/`).
Run: **2026-08-27 — Rifkie**.

---

## 1. `machine-reveal` — image sequence (Embrix machine reveal)

Client drop `New CCS Vid.mov` turned into a scroll-scrubbable frame sequence.

### Source master

| | |
|---|---|
| File | `_source/new-ccs-vid.mov` (archive — do not ship) |
| Dimensions | 1914 × 1080, 30 fps, 5.07 s, 152 frames |
| Codec | H.264 (9.3 Mbps) + AAC audio |
| Size | **5.61 MB** |
| Colour | bt709 primaries/transfer → sRGB, no CMYK risk |
| faststart | ✗ `moov` after `mdat` — irrelevant now (archive only), but never ship this file directly |

### Output

| Deliverable | Spec | Files | Size |
|---|---|---|---|
| `sequences/machine-reveal/1440/` | 1440 × 812 WebP q82 | 152 | **4.79 MB** (avg 32.3 KB/frame) |
| `sequences/machine-reveal/720/` | 720 × 406 WebP q82 | 152 | **2.06 MB** (avg 13.9 KB/frame) |
| `posters/machine-reveal-poster.jpg` | 1440 × 812 JPEG q80, progressive | 1 | **74.5 KB** (< 100 KB ✓) |
| `videos/machine-reveal.mp4` | 1440 × 812, x264 CRF 26 `-preset slow`, `-an`, `+faststart`, yuv420p | 1 | **543 KB** |

Frames are `machine-reveal-0001.webp` … `machine-reveal-0152.webp` (1-based, 4-digit pad).
Machine-readable spec: `sequences/machine-reveal/sequence.json`.

### Decisions & why

- **Fresh client drop, not yet on the site** → not bound to the source format (SOP Phase 3), so **WebP**.
- **q82 verified, not guessed.** Y-SSIM vs a lossless 1440 reference: **0.978 / 0.981 / 0.983** (frames 152 / 100 / 60) — clear of the 0.968 floor. Also eyeballed at 200% on the `EmbriX` head decal and needle bars: indistinguishable. SSIM was the safety net, not the target.
- **All 152 frames kept.** The subject is dark studio footage, so it compresses hard — a full-rate 30 fps scrub costs only 4.79 MB. Dropping to every 2nd frame would halve that but visibly coarsen the scrub; only do it if the hero budget gets tight.
- **Two tiers, not one.** 1440 is retina for a container up to ~720 CSS px and 1:1 for a full-bleed desktop hero; 720 covers phones at ~2.06 MB. Serve by `matchMedia`, never both.
- **Audio stripped** (`-an`) — a scrubbed sequence is silent by definition.
- **Poster is frame 0152, not 0001.** Frame 0001 is fully black on purpose (the shot reveals out of darkness), so it is useless as a fallback still. 0152 is the fully-lit front view.
- **`.mp4` fallback included** for contexts where 152 requests are the wrong trade (a plain autoplay/loop embed, or a reduced-motion / low-end path). Duration and frame count match the source exactly; faststart verified `True`.

### Open items

- ⚠️ **Not yet placed on the site.** No section in `site-mirror/` currently references this asset, so `cdn-swap-checklist.md` is a template — fill it once Ciptaraka positions the sequence in Webflow.
- The sequence is 152 files per tier. That is normal for canvas scrubbing over HTTP/2, but it needs a **preload gate** (decode all frames before the scrub arms) or the first pass will stutter. Player code belongs in `../custom-code/`, not here.

---

## Hosting (SOP Phase 2 rules — do not improvise)

- Upload to the **public** studio asset repo `40hstudio/asset` under `ccs-gmbh/`:
  `ccs-gmbh/sequences/machine-reveal/1440/…`, `…/720/…`, `ccs-gmbh/posters/`, `ccs-gmbh/videos/`.
- **Never serve from this repo** — `40hstudio/ccs-gmbh` is private and jsDelivr cannot read private repos.
- **Pin the full commit SHA**: `https://cdn.jsdelivr.net/gh/40hstudio/asset@<full-sha>/ccs-gmbh/…`. Never `@main`, never unpinned.
- jsDelivr `/gh` caps a file at 20 MB — largest file here is 543 KB, so nothing is close.
- This folder stays in the project repo as the **archive**, including `_source/`.
