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
| `asiamed/videos/needle-insertion.mp4` | CDN | 191 KB |
| `asiamed/posters/needle-insertion-poster.jpg` | CDN | 49 KB |

Both well under jsDelivr's 20 MB `/gh` limit.

## 3. Embed

**This clip is not yet placed on any page** — `0907.mp4` appears in no exported
HTML. Confirm with [[Wahyu]]/[[Dicky]] which section it belongs to before
embedding, then use the matching block below.

Use a Webflow **Embed element**, never the Background Video element.

**MP4 only — there is no WebM.** VP9 tested larger *and* lower quality on this
footage (see README). Don't add a `.webm` `<source>`; it would 404.

### If it lands above the fold

```html
<video
  autoplay muted loop playsinline
  preload="metadata"
  poster="https://cdn.jsdelivr.net/gh/INSYNC-Development/asset@<SHA>/asiamed/posters/needle-insertion-poster.jpg"
  style="width:100%;height:100%;object-fit:cover;">
  <source src="https://cdn.jsdelivr.net/gh/INSYNC-Development/asset@<SHA>/asiamed/videos/needle-insertion.mp4" type="video/mp4">
</video>
```

### If it lands below the fold (likely — it's a section clip, not a hero)

```html
<video
  muted loop playsinline
  preload="none"
  poster="https://cdn.jsdelivr.net/gh/INSYNC-Development/asset@<SHA>/asiamed/posters/needle-insertion-poster.jpg"
  class="lazy-video"
  style="width:100%;height:100%;object-fit:cover;">
  <source data-src="https://cdn.jsdelivr.net/gh/INSYNC-Development/asset@<SHA>/asiamed/videos/needle-insertion.mp4" type="video/mp4">
</video>
```

The lazy-load script goes in **once per page**, not once per video — see
[[Webflow Video Optimization]] Step 3. Check whether the Qualität/Akupunkturnadeln
pages already carry it before pasting a second copy.

> **Aspect ratio:** this clip is **portrait 1080×1340** (≈4:5), not 16:9.
> `object-fit: cover` in a wide container will crop the needles top and bottom.
> Give it a portrait or square container, or switch to `object-fit: contain`.

## 4. Verify after publish

- [ ] Both URLs return **HTTP 200** (`curl -I`)
- [ ] URL is pinned to the full SHA — no `@main`, no branch name
- [ ] Video plays on **iPhone Safari**: autoplays, no black frame, no tap needed
- [ ] Poster shows instantly, and the first video frame matches it (no jump)
- [ ] Below-the-fold: nothing downloads until scrolled near — check DevTools Network
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
