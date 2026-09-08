# CDN swap checklist — Asiamed

Per [[Webflow Asset Optimization & Performance Audit — SOP]] Phase 5.
Fill `<SHA>` in once [[Rifkie]] returns the commit SHA from the push.

**Org:** `INSYNC-Development` (Asiamed is an InSync-owned project)
**Handoff folder:** `02-Webflow Project/optimized-assets/asiamed/`

---

## 1. Hand off

- [ ] Hand `optimized-assets/asiamed/` to [[Rifkie]] — that folder only, nothing else
- [ ] Rifkie pushes to `INSYNC-Development/asset` and returns the **full commit SHA**
- [ ] Record the SHA here: `_______________________________________`

URL shape once pinned (full SHA, never `@main`):

```
https://cdn.jsdelivr.net/gh/INSYNC-Development/asset@<SHA>/asiamed/videos/needle-insertion.mp4
https://cdn.jsdelivr.net/gh/INSYNC-Development/asset@<SHA>/asiamed/posters/needle-insertion-poster.jpg
```

## 2. Files in this push

| File | Route | Size |
|---|---|--:|
| `asiamed/videos/needle-insertion-pingpong.mp4` | CDN | 341 KB |
| `asiamed/posters/needle-insertion-pingpong-poster.jpg` | CDN | 49 KB |
| `asiamed/posters/needle-insertion-poster.jpg` | CDN | 49 KB |
| `asiamed/videos/needle-insertion.mp4` | CDN | 191 KB |

**The ping-pong file is the one to embed.** The forward-only
`needle-insertion.mp4` is already live on `/innovation` and stays in the push as
the source the ping-pong was built from — it is simply no longer referenced.

Both well under jsDelivr's 20 MB `/gh` limit.

## 3. Embed — swap the live element to the ping-pong file

**Already live** on https://asiamed-site.webflow.io/innovation as
`<video data-video="research" class="u-video">`, inside `.research_visual`.
This is a **one-attribute swap**, not a new embed: point `src` at the
ping-pong file. Everything else on the element is already correct.

```
needle-insertion.mp4   ->   needle-insertion-pingpong.mp4
```

The live element already has `autoplay muted loop playsinline` and the poster,
so the boomerang starts working the moment the filename changes. `loop` on a
baked ping-pong *is* the boomerang — **no JavaScript, and nothing to add.**

Current live markup for reference:

```html
<video
  src=".../videos/needle-insertion.mp4"        <!-- swap this line -->
  poster=".../posters/needle-insertion-pingpong-poster.jpg"
  playsinline autoplay loop muted
  data-video="research" class="u-video"></video>
```

**MP4 only — there is no WebM.** VP9 tested larger *and* lower quality on this
footage (see README). Don't add a `.webm` `<source>`; it would 404.

### Two things to fix while you are in there

**1. The live URL is unpinned.** It currently reads
`insync-client-dev@main`, and the SOP requires a full commit SHA — `@main`
serves the default branch behind a 12h+ cache, so what is live can change
without anyone deploying. Pin it during this swap.

**2. The path does not match the SOP's handoff shape.** Live is
`.../clients/Asiamed/optimized-assets/asiamed/videos/...` — note `asiamed`
appears twice and the repo is `insync-client-dev`, not `asset`. That is
[[Rifkie]]'s call, not something to change unilaterally, but flag it: the SOP
shape is `<org>/asset@<SHA>/<project-slug>/videos/<file>`.

> **Aspect ratio:** this clip is **portrait 1080×1340** (≈4:5), not 16:9.
> Check `.u-video` — `object-fit: cover` in a wide container crops the needles
> top and bottom. Use a portrait/square container, or `object-fit: contain`.

## 4. Verify after publish

- [ ] Both URLs return **HTTP 200** (`curl -I`)
- [ ] URL is pinned to the full SHA — no `@main`, no branch name
- [ ] **The loop actually ping-pongs**: needles go in, then come back out, then
      repeat — watch two full cycles. If it snaps back to the start instead,
      the old forward-only file is still being served (or a CDN cache is stale).
- [ ] **No freeze at either end of the cycle** — the turnaround and the loop
      point should move like any other frame. A visible one-frame hold means a
      duplicated seam frame, i.e. the `trim` was dropped from the encode.
- [ ] Video plays on **iPhone Safari**: autoplays, no black frame, no tap needed
- [ ] Poster shows instantly, and the first video frame matches it (no jump)
- [ ] No `player.vimeo.com` URL anywhere (DNS-blocked by Indonesian ISPs)

## 5. Related — already-live videos not covered by this push

The QA report found the existing page videos are the heavier problem, and they
are **not** in this handoff:

| Video | Page | Size | Issue |
|---|---|--:|---|
| `0805-3.mp4` | `/akupunkturnadeln` | **5.45 MB** | `autoplay` with no `preload="none"`, no `playsinline`; served from `s3.amazonaws.com`; requested 3× per load |
| `0721(1).mp4` | `/qualitat` | 3.00 MB | `preload="none"` set correctly; still uncompressed |

Both download in full on mobile. Same treatment as this clip would likely take
them under 1 MB each. Worth scoping as a follow-up — see
`03-Project Wiki/QA-Report.md` finding #3.
