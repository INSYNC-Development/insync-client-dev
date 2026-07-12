/**
 * <gemskorn-physics> — Wix Studio Custom Element
 *
 * Draggable physics shapes for the Gemskorn hero section.
 * Built on Matter.js (loaded dynamically from jsDelivr).
 *
 * All 5 logo elements — geometry + colors extracted 1:1 from the official
 * Gemskorn logo vector file (AI/PDF):
 *   ring      — coral closed donut (the `O`)
 *   halfRing  — pink hollow ∪ half-ring
 *   chevron   — blue `<` arrow (the `K` element), sharp tip, ~108° opening
 *   triangle  — yellow right isosceles triangle
 *   circle    — green solid dot
 *
 * Each element appears exactly 3× — large / medium / small — with all
 * per-kind proportions locked to the logo (e.g. circle radius = ring inner
 * radius, chevron height = ring outer diameter).
 *
 * Usage:
 *   <gemskorn-physics></gemskorn-physics>
 *
 * Optional attributes:
 *   bg-color="#1A1F3A"   — section background color
 *   gravity="1"          — gravity strength (0 = floating)
 *   debug                — show physics body outlines (debug mode)
 */
(function () {
  'use strict';

  const MATTER_CDN = 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js';

  // ── Brand colors (extracted from the official logo file, locked to kinds) ──
  const BG_COLOR = '#22213A';

  const BRAND_SHAPES = {
    ring:     { color: '#EA5F5F' }, // Coral — closed donut (the `O` element)
    halfRing: { color: '#DA3289' }, // Pink — hollow ∪ half-ring
    chevron:  { color: '#3C509E' }, // Blue — `<` arrow (the `K` element)
    triangle: { color: '#FABA25' }, // Yellow — right isosceles triangle
    circle:   { color: '#298952' }, // Green — solid dot
  };

  // Reference width — shapes are defined at this width and scale proportionally.
  const REF_WIDTH = 1440;
  const REF_HEIGHT = 720;

  // ── Logo-exact geometry ratios ─────────────────────────────────────────────
  // Measured from the logo vector file:
  //   ring/halfRing: inner radius = 0.4651 × outer radius
  //   chevron:       half-height = ring outer radius, width = 1.4663 × half-height
  //   triangle:      leg = 0.6511 × ring outer radius
  //   circle:        radius = 0.4651 × ring outer radius (= ring inner radius)
  const RING_INNER_RATIO = 0.4651;
  const RING_CENTER_RATIO = (1 + RING_INNER_RATIO) / 2;   // centerline radius
  const RING_THICK_RATIO = 1 - RING_INNER_RATIO;          // stroke thickness

  // Chevron `<` (pointing left) — 6-vertex polygon in centroid-local units,
  // normalized by half-height, y-down. Derived from logo vertices.
  const CHEV_VERTS = [
    { x: -0.7332, y:  0 },   // sharp outer tip (left)
    { x: -0.0104, y: -1 },   // top inner back corner
    { x:  0.7331, y: -1 },   // top outer back corner (horizontal cut)
    { x:  0.0104, y:  0 },   // V-notch (right)
    { x:  0.7331, y:  1 },   // bottom outer back corner (horizontal cut)
    { x: -0.0104, y:  1 },   // bottom inner back corner
  ];
  // Physics arms (two parallelograms ≈ rotated rectangles), same units:
  const CHEV_ARM_LEN   = 1.2339;  // centerline length
  const CHEV_ARM_THICK = 0.6026;  // perpendicular thickness
  const CHEV_ARM_ANGLE = 0.9449;  // rad (≈54.1° from horizontal)

  // Triangle: right isosceles (right angle top-right, hypotenuse ↙), verts in
  // centroid-local units normalized by leg length, y-down.
  const TRI_VERTS = [
    { x:  1 / 3, y:  2 / 3 },   // bottom-right
    { x:  1 / 3, y: -1 / 3 },   // top-right (right angle)
    { x: -2 / 3, y: -1 / 3 },   // top-left
  ];

  // ── Shape instances ────────────────────────────────────────────────────────
  // Each entry: { kind, x, y, size, rotation? }
  // Color is auto-applied from BRAND_SHAPES — cannot be overridden per instance.
  // Every kind appears exactly 3× in three size tiers (large/medium/small).
  // Size semantics per kind:
  //   ring/halfRing/chevron: size = ring outer radius / chevron half-height
  //   triangle: size = leg length     circle: size = radius
  // Tier base: ring outer radius L=140 / M=95 / S=60; other kinds follow
  // logo proportions relative to that.
  const TIER = { L: 140, M: 95, S: 60 };
  const sz = {
    ring:     (t) => TIER[t],
    halfRing: (t) => TIER[t],
    chevron:  (t) => TIER[t],
    triangle: (t) => Math.round(TIER[t] * 0.6511),
    circle:   (t) => Math.round(TIER[t] * 0.4651),
  };

  const SHAPES = [
    // Coral rings — L / M / S
    { kind: 'ring',     x: 200,  y: 300, size: sz.ring('L') },
    { kind: 'ring',     x: 640,  y: 200, size: sz.ring('M') },
    { kind: 'ring',     x: 1080, y: 260, size: sz.ring('S') },

    // Pink half-rings — L / M / S
    { kind: 'halfRing', x: 420,  y: 520, size: sz.halfRing('L'), rotation: 0.4 },
    { kind: 'halfRing', x: 860,  y: 480, size: sz.halfRing('M'), rotation: -0.9 },
    { kind: 'halfRing', x: 1300, y: 420, size: sz.halfRing('S'), rotation: 2.4 },

    // Blue chevrons — L / M / S
    { kind: 'chevron',  x: 1150, y: 540, size: sz.chevron('L') },
    { kind: 'chevron',  x: 330,  y: 140, size: sz.chevron('M'), rotation: 0.8 },
    { kind: 'chevron',  x: 760,  y: 120, size: sz.chevron('S'), rotation: -1.1 },

    // Yellow triangles — L / M / S
    { kind: 'triangle', x: 980,  y: 90,  size: sz.triangle('L'), rotation: 0.3 },
    { kind: 'triangle', x: 520,  y: 100, size: sz.triangle('M'), rotation: -0.5 },
    { kind: 'triangle', x: 80,   y: 120, size: sz.triangle('S'), rotation: 1.2 },

    // Green circles — L / M / S
    { kind: 'circle',   x: 1360, y: 150, size: sz.circle('L') },
    { kind: 'circle',   x: 150,  y: 80,  size: sz.circle('M') },
    { kind: 'circle',   x: 600,  y: 340, size: sz.circle('S') },
  ];

  // ── Matter loader ──────────────────────────────────────────────────────────
  let matterPromise = null;
  function loadMatter() {
    if (window.Matter) return Promise.resolve(window.Matter);
    if (matterPromise) return matterPromise;
    matterPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = MATTER_CDN;
      s.async = true;
      s.onload = () => resolve(window.Matter);
      s.onerror = () => reject(new Error('Failed to load Matter.js'));
      document.head.appendChild(s);
    });
    return matterPromise;
  }

  // ── Body builders ──────────────────────────────────────────────────────────
  // size semantics: see SHAPES comment above.

  // Ring: closed thick donut. Compound body of segment rectangles forming
  // a complete 360° circle. Centroid sits at the geometric center (no offset).
  function buildRingBody(Matter, x, y, size, options) {
    const radius = size * RING_CENTER_RATIO;
    const thickness = size * RING_THICK_RATIO;
    const segments = 32;
    const angleStep = (2 * Math.PI) / segments;
    const segLen = 2 * radius * Math.sin(angleStep / 2) * 1.05;
    const parts = [];
    for (let i = 0; i < segments; i++) {
      const a = i * angleStep + angleStep / 2;
      parts.push(
        Matter.Bodies.rectangle(
          x + Math.cos(a) * radius,
          y + Math.sin(a) * radius,
          segLen,
          thickness,
          { angle: a + Math.PI / 2 }
        )
      );
    }
    return Matter.Body.create({ parts, ...options });
  }

  // Half-ring: hollow ∪ shape, 180° opening. Compound body of segments along
  // the bottom semicircle (angles 0 to π in Y-down). Centroid is offset
  // toward the bulk of the arc — see HALF_RING_CENTROID_OFFSET in renderer.
  // Mean of sin(a) over [0, π] = 2/π ≈ 0.6366 — centroid offset on Y axis.
  const HALF_RING_CENTROID_OFFSET = 2 / Math.PI;
  function buildHalfRingBody(Matter, x, y, size, options) {
    const radius = size * RING_CENTER_RATIO;
    const thickness = size * RING_THICK_RATIO;
    const segments = 18;
    const angleStep = Math.PI / segments;
    const segLen = 2 * radius * Math.sin(angleStep / 2) * 1.05;
    const parts = [];
    for (let i = 0; i < segments; i++) {
      const a = i * angleStep + angleStep / 2;
      parts.push(
        Matter.Bodies.rectangle(
          x + Math.cos(a) * radius,
          y + Math.sin(a) * radius,
          segLen,
          thickness,
          { angle: a + Math.PI / 2 }
        )
      );
    }
    return Matter.Body.create({ parts, ...options });
  }

  // Triangle: right isosceles (logo-exact). Vertices already centroid-centered.
  function buildTriangleBody(Matter, x, y, size, options) {
    const verts = TRI_VERTS.map((v) => ({ x: v.x * size, y: v.y * size }));
    return Matter.Bodies.fromVertices(x, y, [verts], options);
  }

  // Chevron `<`: two parallelogram arms approximated by rotated rectangles.
  // Body centroid lands at (x, y); sharp tip points LEFT (logo orientation).
  function buildChevronBody(Matter, x, y, size, options) {
    const armLen = size * CHEV_ARM_LEN;
    const thickness = size * CHEV_ARM_THICK;
    const top = Matter.Bodies.rectangle(
      x, y - size / 2, armLen, thickness, { angle: -CHEV_ARM_ANGLE }
    );
    const bot = Matter.Bodies.rectangle(
      x, y + size / 2, armLen, thickness, { angle: CHEV_ARM_ANGLE }
    );
    return Matter.Body.create({ parts: [top, bot], ...options });
  }

  // Circle: solid dot — a plain circle body.
  function buildCircleBody(Matter, x, y, size, options) {
    return Matter.Bodies.circle(x, y, size, options);
  }

  const BUILDERS = {
    ring:     buildRingBody,
    halfRing: buildHalfRingBody,
    chevron:  buildChevronBody,
    triangle: buildTriangleBody,
    circle:   buildCircleBody,
  };

  // ── Renderers ──────────────────────────────────────────────────────────────
  // Each renderer draws in the body's local frame (origin = body.position,
  // already rotated to body.angle by the caller).

  // Closed donut: outer circle minus inner circle. Centroid = arc center.
  function drawRing(ctx, shape) {
    const outer = shape.size * shape._scale;
    const inner = outer * RING_INNER_RATIO;
    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, 2 * Math.PI, false);
    ctx.arc(0, 0, inner, 2 * Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
  }

  // Hollow half-ring (∪). Arc geometric center is offset from body centroid
  // by HALF_RING_CENTROID_OFFSET × centerline radius in body-local Y so the
  // visual aligns with the physics body. Flat caps via closePath.
  function drawHalfRing(ctx, shape) {
    const outer = shape.size * shape._scale;
    const inner = outer * RING_INNER_RATIO;
    const cy = -HALF_RING_CENTROID_OFFSET * outer * RING_CENTER_RATIO;
    ctx.beginPath();
    ctx.arc(0, cy, outer, 0, Math.PI, false);
    ctx.arc(0, cy, inner, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
  }

  function drawTriangle(ctx, shape) {
    const s = shape.size * shape._scale;
    ctx.beginPath();
    ctx.moveTo(TRI_VERTS[0].x * s, TRI_VERTS[0].y * s);
    ctx.lineTo(TRI_VERTS[1].x * s, TRI_VERTS[1].y * s);
    ctx.lineTo(TRI_VERTS[2].x * s, TRI_VERTS[2].y * s);
    ctx.closePath();
    ctx.fill();
  }

  // Chevron `<`: logo-exact 6-vertex polygon — sharp mitered tip on the left,
  // V-notch on the right, horizontal back cuts (each arm a parallelogram).
  function drawChevron(ctx, shape) {
    const s = shape.size * shape._scale;
    ctx.beginPath();
    ctx.moveTo(CHEV_VERTS[0].x * s, CHEV_VERTS[0].y * s);
    for (let i = 1; i < CHEV_VERTS.length; i++) {
      ctx.lineTo(CHEV_VERTS[i].x * s, CHEV_VERTS[i].y * s);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawCircle(ctx, shape) {
    const r = shape.size * shape._scale;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.fill();
  }

  const RENDERERS = {
    ring:     drawRing,
    halfRing: drawHalfRing,
    chevron:  drawChevron,
    triangle: drawTriangle,
    circle:   drawCircle,
  };

  // ── Custom Element ─────────────────────────────────────────────────────────
  class GemskornPhysics extends HTMLElement {
    constructor() {
      super();
      this._shapes = [];
      this._engine = null;
      this._world = null;
      this._cursorBody = null;
      this._cursorRadius = 30;
      this._walls = [];
      this._raf = null;
      this._resizeObserver = null;
      this._intersectionObserver = null;
      this._started = false;
      this._canvas = null;
      this._ctx = null;
      this._dpr = window.devicePixelRatio || 1;
      this._width = 0;
      this._height = 0;
      this._scale = 1;
      this._destroyed = false;
    }

    async connectedCallback() {
      this.style.display = 'block';
      this.style.position = 'relative';
      this.style.width = '100%';
      this.style.height = '100%';
      this.style.minHeight = '480px';
      this.style.overflow = 'hidden';
      this.style.backgroundColor = this.getAttribute('bg-color') || BG_COLOR;
      // Hover-only interaction — let the browser handle scroll naturally.
      this.style.touchAction = 'auto';

      this._canvas = document.createElement('canvas');
      this._canvas.style.position = 'absolute';
      this._canvas.style.inset = '0';
      this._canvas.style.width = '100%';
      this._canvas.style.height = '100%';
      this._canvas.style.display = 'block';
      this.appendChild(this._canvas);
      this._ctx = this._canvas.getContext('2d');

      try {
        const Matter = await loadMatter();
        if (this._destroyed) return;
        this._setupEngine(Matter);
        this._initInput(Matter);
        this._initResize();
        this._initVisibilityTrigger();
      } catch (err) {
        console.error('[gemskorn-physics]', err);
      }
    }

    disconnectedCallback() {
      this._destroyed = true;
      if (this._raf) cancelAnimationFrame(this._raf);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._intersectionObserver) this._intersectionObserver.disconnect();
      if (this._engine && window.Matter) {
        window.Matter.Engine.clear(this._engine);
      }
      this._shapes = [];
      this._walls = [];
    }

    _setupEngine(Matter) {
      this._Matter = Matter;
      // Higher iterations = stable collisions at high cursor velocities.
      this._engine = Matter.Engine.create({
        velocityIterations: 8,
        positionIterations: 8,
        constraintIterations: 4,
      });
      const gravity = parseFloat(this.getAttribute('gravity'));
      this._engine.gravity.y = isNaN(gravity) ? 1 : gravity;
      this._world = this._engine.world;
      this._measure();
    }

    // Wait for the section to enter the viewport before spawning shapes.
    // Fires exactly once — after that, shapes stay where physics leaves them.
    _initVisibilityTrigger() {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !this._started) {
              this._started = true;
              this._start();
              this._intersectionObserver.disconnect();
              this._intersectionObserver = null;
            }
          }
        },
        { threshold: 0.15 }
      );
      this._intersectionObserver.observe(this);
    }

    _start() {
      this._buildShapes();
      this._buildWalls();
      this._raf = requestAnimationFrame(this._tick.bind(this));
    }

    _measure() {
      const rect = this.getBoundingClientRect();
      this._width = Math.max(1, rect.width);
      this._height = Math.max(1, rect.height);
      this._scale = this._width / REF_WIDTH;
      this._canvas.width = this._width * this._dpr;
      this._canvas.height = this._height * this._dpr;
      this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    }

    _buildShapes() {
      const Matter = this._Matter;
      const sx = this._scale;
      const sy = this._scale;
      const yOffset = this._height - REF_HEIGHT * sy;

      const shapeOpts = {
        restitution: 0.7,    // Bouncier — shapes ricochet on impact
        friction: 0.05,
        frictionAir: 0.001,  // Lower drag — shapes coast longer after a hit
        density: 0.001,
      };

      SHAPES.forEach((def) => {
        const builder = BUILDERS[def.kind];
        const brand = BRAND_SHAPES[def.kind];
        if (!builder || !brand) {
          console.warn('[gemskorn-physics] Unknown shape kind:', def.kind);
          return;
        }

        const x = def.x * sx;
        const y = def.y * sy + yOffset;
        const size = def.size * sx;
        const body = builder(Matter, x, y, size, shapeOpts);
        if (!body) return;

        if (def.rotation) Matter.Body.setAngle(body, def.rotation);

        const shape = {
          kind: def.kind,
          color: brand.color, // Locked, never per-instance
          size: def.size,
          body,
          _scale: sx,
        };

        // Drop-in entry: spawn slightly above and let gravity settle.
        Matter.Body.translate(body, { x: 0, y: -200 - Math.random() * 200 });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

        this._shapes.push(shape);
        Matter.Composite.add(this._world, body);
      });
    }

    _buildWalls() {
      const Matter = this._Matter;
      const w = this._width;
      const h = this._height;
      const t = 100;
      const opts = { isStatic: true, friction: 0.1, restitution: 0.2 };

      this._walls = [
        Matter.Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, opts),
        Matter.Bodies.rectangle(-t / 2, h / 2, t, h * 2, opts),
        Matter.Bodies.rectangle(w + t / 2, h / 2, t, h * 2, opts),
        Matter.Bodies.rectangle(w / 2, -h - t / 2, w + t * 2, t, opts),
      ];
      Matter.Composite.add(this._world, this._walls);
    }

    // Cursor-as-body: invisible static circle that tracks the mouse.
    // We also track mouse velocity and write it to the body so collisions
    // impart real impulse to shapes — fast sweeps actually launch them.
    _initInput() {
      this._createCursorBody();

      let lastX = null;
      let lastY = null;
      let lastT = null;

      const updateCursor = (clientX, clientY) => {
        if (!this._cursorBody) return;
        const rect = this._canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const now = performance.now();

        // Compute mouse velocity in px/ms; scale to a sensible Matter velocity.
        if (lastT !== null) {
          const dt = now - lastT;
          if (dt > 0 && dt < 100) {
            // Scale factor tuned so quick flicks throw shapes; gentle moves nudge.
            const scale = 0.2;
            const vx = ((x - lastX) / dt) * 16 * scale;
            const vy = ((y - lastY) / dt) * 16 * scale;
            this._Matter.Body.setVelocity(this._cursorBody, { x: vx, y: vy });
          }
        }
        lastX = x; lastY = y; lastT = now;

        this._Matter.Body.setPosition(this._cursorBody, { x, y });
      };

      const parkCursor = () => {
        if (!this._cursorBody) return;
        this._Matter.Body.setVelocity(this._cursorBody, { x: 0, y: 0 });
        this._Matter.Body.setPosition(this._cursorBody, { x: -99999, y: -99999 });
        lastX = lastY = lastT = null;
      };

      this._canvas.addEventListener('mousemove', (e) => updateCursor(e.clientX, e.clientY));
      this._canvas.addEventListener('mouseleave', parkCursor);
    }

    _createCursorBody() {
      // 4% of section width → ~58px on a 1440 hero. Big enough to feel solid,
      // small enough not to dominate the canvas.
      this._cursorRadius = Math.max(30, this._width * 0.04);
      this._cursorBody = this._Matter.Bodies.circle(
        -99999, -99999, this._cursorRadius,
        { isStatic: true, label: 'cursor', restitution: 0.9 }
      );
      this._Matter.Composite.add(this._world, this._cursorBody);
    }

    _initResize() {
      this._resizeObserver = new ResizeObserver(() => {
        if (!this._engine) return;
        this._rebuild();
      });
      this._resizeObserver.observe(this);
    }

    _rebuild() {
      const Matter = this._Matter;
      Matter.Composite.clear(this._world, false, true);
      this._shapes = [];
      this._walls = [];
      this._cursorBody = null;
      this._measure();
      if (this._started) {
        this._buildShapes();
        this._buildWalls();
      }
      this._createCursorBody();
    }

    _tick() {
      if (this._destroyed) return;
      // Sub-step physics at ~120Hz while rendering at 60Hz —
      // smoother visuals + better collision quality at high speeds.
      const halfStep = 1000 / 120;
      this._Matter.Engine.update(this._engine, halfStep);
      this._Matter.Engine.update(this._engine, halfStep);
      this._render();
      this._raf = requestAnimationFrame(this._tick.bind(this));
    }

    _render() {
      const ctx = this._ctx;
      const debug = this.hasAttribute('debug');

      ctx.clearRect(0, 0, this._width, this._height);

      this._shapes.forEach((shape) => {
        ctx.save();
        ctx.translate(shape.body.position.x, shape.body.position.y);
        ctx.rotate(shape.body.angle);
        ctx.fillStyle = shape.color;
        const renderer = RENDERERS[shape.kind];
        if (renderer) renderer(ctx, shape);
        ctx.restore();
      });

      if (debug) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        const all = this._Matter.Composite.allBodies(this._world);
        all.forEach((body) => {
          const parts = body.parts.length > 1 ? body.parts.slice(1) : [body];
          parts.forEach((p) => {
            ctx.beginPath();
            const v = p.vertices;
            ctx.moveTo(v[0].x, v[0].y);
            for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
            ctx.closePath();
            ctx.stroke();
          });
        });
      }
    }
  }

  if (!customElements.get('gemskorn-physics')) {
    customElements.define('gemskorn-physics', GemskornPhysics);
  }
})();
