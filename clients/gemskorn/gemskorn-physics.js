/**
 * <gemskorn-physics> — Wix Studio Custom Element
 *
 * Draggable physics shapes for the Gemskorn hero section.
 * Built on Matter.js (loaded dynamically from jsDelivr).
 *
 * Brand-locked: each shape kind has a fixed color baked in (BRAND_SHAPES below).
 * The SHAPES array specifies only kind + position + size — colors cannot be mixed.
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

  // ── Brand colors (locked to shape kinds) ───────────────────────────────────
  // If Gemskorn provides exact brand hex values, swap them here.
  const BG_COLOR = '#22213A';

  const BRAND_SHAPES = {
    ring:     { color: '#EE4D5A' }, // Coral — closed donut (the `O` element)
    triangle: { color: '#F2B632' }, // Yellow — accent triangle
    chevron:  { color: '#3047C7' }, // Blue — `>` arrow
    halfRing: { color: '#C8197A' }, // Pink — hollow ∪ half-ring, 180° opening
    square:   { color: '#2BA66E' }, // Green — solid square
  };

  // Reference width — shapes are defined at this width and scale proportionally.
  const REF_WIDTH = 1440;
  const REF_HEIGHT = 720;

  // ── Shape instances ────────────────────────────────────────────────────────
  // Each entry: { kind, x, y, size, rotation? }
  // Color is auto-applied from BRAND_SHAPES — cannot be overridden per instance.
  // Multiple instances per kind are encouraged; just vary size + position.
  const SHAPES = [
    // Coral closed rings (primary anchors) ────────────────────────────────────
    { kind: 'ring',     x: 220,  y: 350, size: 175 },
    { kind: 'ring',     x: 720,  y: 540, size: 130 },
    { kind: 'ring',     x: 1240, y: 580, size: 100 },

    // Yellow triangles (accents) ──────────────────────────────────────────────
    { kind: 'triangle', x: 360,  y: 100, size: 110 },
    { kind: 'triangle', x: 950,  y: 80,  size: 70 },
    { kind: 'triangle', x: 1370, y: 150, size: 50 },

    // Blue chevrons (secondary visual) ────────────────────────────────────────
    { kind: 'chevron',  x: 100,  y: 540, size: 165 },
    { kind: 'chevron',  x: 870,  y: 580, size: 140 },
    { kind: 'chevron',  x: 1100, y: 200, size: 95 },

    // Pink half-rings (accents) ───────────────────────────────────────────────
    { kind: 'halfRing', x: 1340, y: 380, size: 175, rotation: 0.4 },
    { kind: 'halfRing', x: 540,  y: 560, size: 125, rotation: -0.9 },
    { kind: 'halfRing', x: 1010, y: 595, size: 90,  rotation: 2.4 },

    // Green squares (mixed sizes) ─────────────────────────────────────────────
    { kind: 'square',   x: 480,  y: 200, size: 110, rotation: 0.3 },
    { kind: 'square',   x: 780,  y: 100, size: 75,  rotation: -0.5 },
    { kind: 'square',   x: 1180, y: 100, size: 55 },
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

  // Ring: closed thick donut. Compound body of segment rectangles forming
  // a complete 360° circle. Centroid sits at the geometric center (no offset).
  const RING_THICKNESS_RATIO = 0.45;
  function buildRingBody(Matter, x, y, size, options) {
    const radius = size;
    const thickness = size * RING_THICKNESS_RATIO;
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
  // toward the bulk of the arc — see HALF_RING_CY in renderer.
  const HALF_RING_THICKNESS_RATIO = 0.45;
  // Mean of sin(a) over [0, π] = 2/π ≈ 0.6366 — centroid offset on Y axis.
  const HALF_RING_CENTROID_OFFSET = 2 / Math.PI;
  function buildHalfRingBody(Matter, x, y, size, options) {
    const radius = size;
    const thickness = size * HALF_RING_THICKNESS_RATIO;
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

  // Triangle: equilateral-ish pointing down (apex at bottom).
  // Vertices already centered on centroid.
  function buildTriangleBody(Matter, x, y, size, options) {
    const verts = [
      { x: -size,        y: -size * 0.467 },
      { x:  size,        y: -size * 0.467 },
      { x:  0,           y:  size * 0.933 },
    ];
    return Matter.Bodies.fromVertices(x, y, [verts], options);
  }

  // Chevron: `>` arrow pointing right at a 90° opening (right angle).
  // Compound body of two rectangle arms meeting at a tip.
  // Body centroid lands at (x, y); tip is offset right.
  const CHEVRON_HALF_ANGLE = Math.PI / 4; // 45° → arms meet at 90°
  const CHEVRON_THICKNESS_RATIO = 0.30;
  function buildChevronBody(Matter, x, y, size, options) {
    const halfAngle = CHEVRON_HALF_ANGLE;
    const armLen = size;
    const thickness = size * CHEVRON_THICKNESS_RATIO;
    const sinA = Math.sin(halfAngle);
    const top = Matter.Bodies.rectangle(
      x, y - sinA * armLen / 2, armLen, thickness, { angle: halfAngle }
    );
    const bot = Matter.Bodies.rectangle(
      x, y + sinA * armLen / 2, armLen, thickness, { angle: -halfAngle }
    );
    return Matter.Body.create({ parts: [top, bot], ...options });
  }

  // Square: trivial.
  function buildSquareBody(Matter, x, y, size, options) {
    return Matter.Bodies.rectangle(x, y, size, size, options);
  }

  const BUILDERS = {
    ring:     buildRingBody,
    triangle: buildTriangleBody,
    chevron:  buildChevronBody,
    halfRing: buildHalfRingBody,
    square:   buildSquareBody,
  };

  // ── Renderers ──────────────────────────────────────────────────────────────
  // Each renderer draws in the body's local frame (origin = body.position,
  // already rotated to body.angle by the caller).

  // Closed donut: outer circle minus inner circle. Centroid = arc center.
  function drawRing(ctx, shape) {
    const r = shape.size * shape._scale;
    const t = r * RING_THICKNESS_RATIO;
    const outer = r + t / 2;
    const inner = r - t / 2;
    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, 2 * Math.PI, false);
    ctx.arc(0, 0, inner, 2 * Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
  }

  // Hollow half-ring (∪). Arc geometric center is offset from body centroid
  // by HALF_RING_CENTROID_OFFSET in body-local Y so the visual aligns with
  // the physics body. The two flat caps are formed implicitly via closePath.
  function drawHalfRing(ctx, shape) {
    const r = shape.size * shape._scale;
    const t = r * HALF_RING_THICKNESS_RATIO;
    const outer = r + t / 2;
    const inner = r - t / 2;
    const cy = -HALF_RING_CENTROID_OFFSET * r;
    ctx.beginPath();
    ctx.arc(0, cy, outer, 0, Math.PI, false);
    ctx.arc(0, cy, inner, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
  }

  function drawTriangle(ctx, shape) {
    const s = shape.size * shape._scale;
    ctx.beginPath();
    ctx.moveTo(-s,  -s * 0.467);
    ctx.lineTo( s,  -s * 0.467);
    ctx.lineTo( 0,   s * 0.933);
    ctx.closePath();
    ctx.fill();
  }

  // Render the chevron as a single 6-point concave polygon with a mitered
  // outer tip and a clean V-notch inside. Math assumes 90° opening (45° each).
  function drawChevron(ctx, shape) {
    const L = shape.size * shape._scale;            // arm length (centerline)
    const t = L * CHEVRON_THICKNESS_RATIO;          // thickness
    const r = Math.SQRT1_2;                          // 1/√2

    // Body centroid is at origin. Centerlines' apex is at (L*r/2, 0).
    // Outer mitered tip extends past it by t*r; V-notch sits behind it by t*r.
    const tipX   = L * r / 2 + t * r;
    const notchX = L * r / 2 - t * r;
    const farXo  = -L * r / 2 + t * r / 2;          // outer-far x
    const farXi  = -L * r / 2 - t * r / 2;          // inner-far x
    const farYo  =  L * r + t * r / 2;              // outer-far |y|
    const farYi  =  L * r - t * r / 2;              // inner-far |y|

    ctx.beginPath();
    ctx.moveTo(tipX,   0);          // 1. outer mitered tip
    ctx.lineTo(farXo, -farYo);      // 2. top-outer far corner
    ctx.lineTo(farXi, -farYi);      // 3. top-inner far corner
    ctx.lineTo(notchX, 0);          // 4. V notch
    ctx.lineTo(farXi,  farYi);      // 5. bot-inner far corner
    ctx.lineTo(farXo,  farYo);      // 6. bot-outer far corner
    ctx.closePath();
    ctx.fill();
  }

  function drawSquare(ctx, shape) {
    const s = shape.size * shape._scale;
    ctx.fillRect(-s / 2, -s / 2, s, s);
  }

  const RENDERERS = {
    ring:     drawRing,
    triangle: drawTriangle,
    chevron:  drawChevron,
    halfRing: drawHalfRing,
    square:   drawSquare,
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
