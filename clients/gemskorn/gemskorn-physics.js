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
  const BG_COLOR = '#22213a';

  const BRAND_SHAPES = {
    cShape:     { color: '#EE4D5A' }, // Coral — open ring (the `g`/`o` element)
    triangle:   { color: '#F2B632' }, // Yellow — accent triangle
    chevron:    { color: '#3047C7' }, // Blue — `>` arrow
    halfCircle: { color: '#C8197A' }, // Pink — half-disc
    square:     { color: '#2BA66E' }, // Green — solid square
  };

  // Reference width — shapes are defined at this width and scale proportionally.
  const REF_WIDTH = 1440;
  const REF_HEIGHT = 720;

  // ── Shape instances ────────────────────────────────────────────────────────
  // Each entry: { kind, x, y, size, rotation? }
  // Color is auto-applied from BRAND_SHAPES — cannot be overridden per instance.
  // Multiple instances per kind are encouraged; just vary size + position.
  const SHAPES = [
    // Coral C-shapes (primary anchors) ────────────────────────────────────────
    { kind: 'cShape',     x: 220,  y: 350, size: 130, rotation: 0.1 },
    { kind: 'cShape',     x: 1180, y: 580, size: 95,  rotation: -0.4 },
    { kind: 'cShape',     x: 700,  y: 540, size: 80,  rotation: 1.2 },

    // Yellow triangles (accents) ──────────────────────────────────────────────
    { kind: 'triangle',   x: 380,  y: 100, size: 60 },
    { kind: 'triangle',   x: 940,  y: 80,  size: 45 },
    { kind: 'triangle',   x: 1370, y: 150, size: 75 },

    // Blue chevrons (secondary visual) ────────────────────────────────────────
    { kind: 'chevron',    x: 90,   y: 540, size: 110 },
    { kind: 'chevron',    x: 870,  y: 580, size: 130 },
    { kind: 'chevron',    x: 1280, y: 380, size: 85 },

    // Pink half-circles (accents) ─────────────────────────────────────────────
    { kind: 'halfCircle', x: 540,  y: 560, size: 80 },
    { kind: 'halfCircle', x: 1010, y: 595, size: 100 },
    { kind: 'halfCircle', x: 1240, y: 530, size: 130 },

    // Green squares (small accents) ───────────────────────────────────────────
    { kind: 'square',     x: 320,  y: 60,  size: 65, rotation: 0.3 },
    { kind: 'square',     x: 700,  y: 80,  size: 50, rotation: -0.5 },
    { kind: 'square',     x: 1100, y: 100, size: 75 },
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

  // C-shape: open thick ring with a gap. Compound body of segment rectangles.
  // Gap is ~108° opening to the upper-right by default.
  function buildCShapeBody(Matter, x, y, size, options) {
    const radius = size;
    const thickness = size * 0.45;
    const startAngle = -Math.PI * 0.3;
    const endAngle = Math.PI * 1.1;
    const segments = 28;
    const angleStep = (endAngle - startAngle) / segments;
    const segLen = 2 * radius * Math.sin(angleStep / 2) * 1.05;
    const parts = [];
    for (let i = 0; i < segments; i++) {
      const a = startAngle + i * angleStep + angleStep / 2;
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

  // Half-circle: convex semicircle as a polygon body.
  function buildHalfCircleBody(Matter, x, y, size, options) {
    const segments = 24;
    const verts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI;
      verts.push({ x: Math.cos(a) * size, y: -Math.sin(a) * size });
    }
    return Matter.Bodies.fromVertices(x, y, [verts], options);
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

  // Chevron: `>` arrow pointing right. Compound body of two rectangle arms
  // meeting at a tip. Body centroid lands at (x, y); tip is offset right.
  function buildChevronBody(Matter, x, y, size, options) {
    const halfAngle = Math.PI / 6; // 30°
    const armLen = size;
    const thickness = size * 0.32;
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
    cShape:     buildCShapeBody,
    triangle:   buildTriangleBody,
    chevron:    buildChevronBody,
    halfCircle: buildHalfCircleBody,
    square:     buildSquareBody,
  };

  // ── Renderers ──────────────────────────────────────────────────────────────
  // Each renderer draws in the body's local frame (origin = body.position,
  // already rotated to body.angle by the caller).

  function drawCShape(ctx, shape) {
    const r = shape.size * shape._scale;
    const t = r * 0.45;
    const outer = r + t / 2;
    const inner = r - t / 2;
    ctx.beginPath();
    ctx.arc(0, 0, outer, -Math.PI * 0.3, Math.PI * 1.1, false);
    ctx.arc(0, 0, inner, Math.PI * 1.1, -Math.PI * 0.3, true);
    ctx.closePath();
    ctx.fill();
  }

  function drawHalfCircle(ctx, shape) {
    const r = shape.size * shape._scale;
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, 2 * Math.PI);
    ctx.lineTo(-r, 0);
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

  function drawChevron(ctx, shape) {
    const size = shape.size * shape._scale;
    const halfAngle = Math.PI / 6;
    const armLen = size;
    const thickness = size * 0.32;
    const sinA = Math.sin(halfAngle);

    // Top arm
    ctx.save();
    ctx.translate(0, -sinA * armLen / 2);
    ctx.rotate(halfAngle);
    ctx.fillRect(-armLen / 2, -thickness / 2, armLen, thickness);
    ctx.restore();

    // Bottom arm
    ctx.save();
    ctx.translate(0,  sinA * armLen / 2);
    ctx.rotate(-halfAngle);
    ctx.fillRect(-armLen / 2, -thickness / 2, armLen, thickness);
    ctx.restore();
  }

  function drawSquare(ctx, shape) {
    const s = shape.size * shape._scale;
    ctx.fillRect(-s / 2, -s / 2, s, s);
  }

  const RENDERERS = {
    cShape:     drawCShape,
    triangle:   drawTriangle,
    chevron:    drawChevron,
    halfCircle: drawHalfCircle,
    square:     drawSquare,
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
      this._engine = Matter.Engine.create();
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
        restitution: 0.35,
        friction: 0.05,
        frictionAir: 0.005,
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
    // Matter handles collisions with it like any other body — shapes get
    // pushed out of the cursor's path on hover, no click required.
    _initInput() {
      this._createCursorBody();

      const updateCursor = (clientX, clientY) => {
        if (!this._cursorBody) return;
        const rect = this._canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        this._Matter.Body.setPosition(this._cursorBody, { x, y });
      };

      const parkCursor = () => {
        if (!this._cursorBody) return;
        // Park far offscreen so it doesn't push any shape.
        this._Matter.Body.setPosition(this._cursorBody, { x: -99999, y: -99999 });
      };

      this._canvas.addEventListener('mousemove', (e) => updateCursor(e.clientX, e.clientY));
      this._canvas.addEventListener('mouseleave', parkCursor);
    }

    _createCursorBody() {
      // Scale cursor with section width — bigger on desktop, smaller on mobile.
      // Min 20px to avoid tunneling through small shapes.
      this._cursorRadius = Math.max(20, this._width * 0.025);
      this._cursorBody = this._Matter.Bodies.circle(
        -99999, -99999, this._cursorRadius,
        { isStatic: true, label: 'cursor' }
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
      this._Matter.Engine.update(this._engine, 1000 / 60);
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
