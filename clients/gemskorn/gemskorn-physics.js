/**
 * <gemskorn-physics> — Wix Studio Custom Element
 *
 * Draggable physics shapes for the Gemskorn hero section.
 * Built on Matter.js (loaded dynamically from jsDelivr).
 *
 * Usage:
 *   <gemskorn-physics></gemskorn-physics>
 *
 * Optional attributes:
 *   bg-color="#1A1F3A"   — section background color
 *   gravity="1"          — gravity strength (0 = floating)
 *   debug                — show physics body outlines (debug mode)
 *
 * Tune the brand visuals in the COLORS and SHAPES constants below.
 */
(function () {
  'use strict';

  const MATTER_CDN = 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js';

  // ── Brand palette ──────────────────────────────────────────────────────────
  const COLORS = {
    bg: '#22213a',
    yellow: '#F2B632',
    green: '#3FAB6B',
    coral: '#F85B5B',
    pink: '#CC2A7E',
    blue: '#3D55D7',
    white: '#FFFFFF',
  };

  // Reference width — shapes are defined at this width and scale proportionally.
  const REF_WIDTH = 1440;
  const REF_HEIGHT = 720;

  // ── Shape definitions ──────────────────────────────────────────────────────
  // Coordinates are in PIXELS at REF_WIDTH × REF_HEIGHT (origin = top-left).
  // Shapes will scale + reposition to fit the actual section size.
  //
  // Available types:
  //   { type: 'circle',     color, x, y, radius }
  //   { type: 'halfCircle', color, x, y, radius, rotation? }
  //   { type: 'cShape',     color, x, y, radius, thickness, startAngle, endAngle, rotation? }
  //   { type: 'polygon',    color, x, y, points: [[x,y],...], rotation? }
  //   { type: 'lShape',     color, x, y, size, thickness, rotation? }
  //   { type: 'rect',       color, x, y, width, height, rotation? }
  const SHAPES = [
    // ── LEFT CLUSTER ────────────────────────────────────────────────────────
    { type: 'circle',     color: COLORS.yellow, x: 220,  y: 350, radius: 130 },
    { type: 'cShape',     color: COLORS.green,  x: 90,   y: 540, radius: 110, thickness: 55, startAngle: -Math.PI * 0.3, endAngle: Math.PI * 1.1, rotation: 0.1 },
    { type: 'polygon',    color: COLORS.coral,  x: 380,  y: 520, points: [[-70,-50],[80,-30],[90,40],[-30,55],[-80,15]], rotation: -0.25 },

    // ── MID CLUSTER ─────────────────────────────────────────────────────────
    { type: 'circle',     color: COLORS.pink,   x: 540,  y: 560, radius: 80 },
    { type: 'cShape',     color: COLORS.blue,   x: 700,  y: 540, radius: 95, thickness: 50, startAngle: Math.PI * 0.25, endAngle: Math.PI * 1.65, rotation: 0 },
    { type: 'lShape',     color: COLORS.yellow, x: 870,  y: 560, size: 110, thickness: 50, rotation: 0.4 },
    { type: 'circle',     color: COLORS.green,  x: 1010, y: 595, radius: 38 },

    // ── RIGHT CLUSTER ───────────────────────────────────────────────────────
    { type: 'halfCircle', color: COLORS.coral,  x: 1180, y: 320, radius: 165, rotation: -2.0 },
    { type: 'circle',     color: COLORS.blue,   x: 1240, y: 530, radius: 130 },
    { type: 'polygon',    color: COLORS.pink,   x: 1370, y: 600, points: [[-35,-30],[40,-20],[35,35],[-30,40]], rotation: 0.2 },
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
  // Convex semicircle as a polygon body.
  function buildHalfCircleVerts(radius, segments) {
    const verts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI;
      verts.push({ x: Math.cos(a) * radius, y: -Math.sin(a) * radius });
    }
    return verts;
  }

  // Concave C-shape as a compound body of small rectangles along an arc.
  function buildCShapeBody(Matter, x, y, radius, thickness, startAngle, endAngle, options) {
    const segments = 28;
    const angleStep = (endAngle - startAngle) / segments;
    const segLen = 2 * radius * Math.sin(angleStep / 2) * 1.05;
    const parts = [];
    for (let i = 0; i < segments; i++) {
      const a = startAngle + i * angleStep + angleStep / 2;
      const cx = x + Math.cos(a) * radius;
      const cy = y + Math.sin(a) * radius;
      parts.push(
        Matter.Bodies.rectangle(cx, cy, segLen, thickness, {
          angle: a + Math.PI / 2,
        })
      );
    }
    return Matter.Body.create({ parts, ...options });
  }

  // L-shape as compound body of two rectangles.
  function buildLShapeBody(Matter, x, y, size, thickness, options) {
    const half = size / 2;
    const horiz = Matter.Bodies.rectangle(x, y - half + thickness / 2, size, thickness);
    const vert = Matter.Bodies.rectangle(x - half + thickness / 2, y, thickness, size);
    return Matter.Body.create({ parts: [horiz, vert], ...options });
  }

  // ── Renderers ──────────────────────────────────────────────────────────────
  // Each renderer draws in the body's local frame (origin = body.position, rotated to body.angle).
  function drawCircle(ctx, shape) {
    ctx.beginPath();
    ctx.arc(0, 0, shape.radius * shape._scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHalfCircle(ctx, shape) {
    const r = shape.radius * shape._scale;
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, 2 * Math.PI);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fill();
  }

  function drawCShape(ctx, shape) {
    const r = shape.radius * shape._scale;
    const t = shape.thickness * shape._scale;
    const outer = r + t / 2;
    const inner = r - t / 2;
    ctx.beginPath();
    ctx.arc(0, 0, outer, shape.startAngle, shape.endAngle, false);
    ctx.arc(0, 0, inner, shape.endAngle, shape.startAngle, true);
    ctx.closePath();
    ctx.fill();
  }

  function drawPolygon(ctx, shape) {
    const pts = shape.points;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * shape._scale, pts[0][1] * shape._scale);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0] * shape._scale, pts[i][1] * shape._scale);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawLShape(ctx, shape) {
    const s = shape.size * shape._scale;
    const t = shape.thickness * shape._scale;
    const half = s / 2;
    // Horizontal bar (top)
    ctx.fillRect(-half, -half, s, t);
    // Vertical bar (left)
    ctx.fillRect(-half, -half, t, s);
  }

  function drawRect(ctx, shape) {
    const w = shape.width * shape._scale;
    const h = shape.height * shape._scale;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }

  const RENDERERS = {
    circle: drawCircle,
    halfCircle: drawHalfCircle,
    cShape: drawCShape,
    polygon: drawPolygon,
    lShape: drawLShape,
    rect: drawRect,
  };

  // ── Custom Element ─────────────────────────────────────────────────────────
  class GemskornPhysics extends HTMLElement {
    constructor() {
      super();
      this._shapes = [];
      this._engine = null;
      this._world = null;
      this._mouseConstraint = null;
      this._walls = [];
      this._raf = null;
      this._resizeObserver = null;
      this._canvas = null;
      this._ctx = null;
      this._dpr = window.devicePixelRatio || 1;
      this._width = 0;
      this._height = 0;
      this._scale = 1;
      this._destroyed = false;
    }

    async connectedCallback() {
      // Container styles
      this.style.display = 'block';
      this.style.position = 'relative';
      this.style.width = '100%';
      this.style.height = '100%';
      this.style.minHeight = '480px';
      this.style.overflow = 'hidden';
      this.style.backgroundColor = this.getAttribute('bg-color') || COLORS.bg;
      this.style.touchAction = 'none'; // Prevent scroll while dragging on mobile

      // Canvas
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
        this._initPhysics(Matter);
        this._initInput(Matter);
        this._initResize();
        this._raf = requestAnimationFrame(this._tick.bind(this));
      } catch (err) {
        console.error('[gemskorn-physics]', err);
      }
    }

    disconnectedCallback() {
      this._destroyed = true;
      if (this._raf) cancelAnimationFrame(this._raf);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._engine && window.Matter) {
        window.Matter.Engine.clear(this._engine);
      }
      this._shapes = [];
      this._walls = [];
    }

    _initPhysics(Matter) {
      this._Matter = Matter;
      this._engine = Matter.Engine.create();
      const gravity = parseFloat(this.getAttribute('gravity'));
      this._engine.gravity.y = isNaN(gravity) ? 1 : gravity;
      this._world = this._engine.world;

      this._measure();
      this._buildShapes();
      this._buildWalls();
    }

    _measure() {
      const rect = this.getBoundingClientRect();
      this._width = Math.max(1, rect.width);
      this._height = Math.max(1, rect.height);
      this._scale = this._width / REF_WIDTH;

      // Resize canvas with DPR for crisp rendering
      this._canvas.width = this._width * this._dpr;
      this._canvas.height = this._height * this._dpr;
      this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    }

    _buildShapes() {
      const Matter = this._Matter;
      // Map ref-coordinates to actual canvas coordinates.
      // Ref is 1440×720; we keep horizontal scale = width/REF_WIDTH and
      // anchor y at the bottom, so shapes "rest" at the section floor.
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
        const x = def.x * sx;
        const y = def.y * sy + yOffset;
        let body;

        switch (def.type) {
          case 'circle':
            body = Matter.Bodies.circle(x, y, def.radius * sx, shapeOpts);
            break;

          case 'halfCircle': {
            const verts = buildHalfCircleVerts(def.radius * sx, 24);
            body = Matter.Bodies.fromVertices(x, y, [verts], shapeOpts);
            if (def.rotation) Matter.Body.setAngle(body, def.rotation);
            break;
          }

          case 'cShape':
            body = buildCShapeBody(
              Matter,
              x,
              y,
              def.radius * sx,
              def.thickness * sx,
              def.startAngle,
              def.endAngle,
              shapeOpts
            );
            if (def.rotation) Matter.Body.setAngle(body, def.rotation);
            break;

          case 'polygon': {
            const verts = def.points.map(([px, py]) => ({ x: px * sx, y: py * sy }));
            body = Matter.Bodies.fromVertices(x, y, [verts], shapeOpts);
            if (def.rotation) Matter.Body.setAngle(body, def.rotation);
            break;
          }

          case 'lShape':
            body = buildLShapeBody(Matter, x, y, def.size * sx, def.thickness * sx, shapeOpts);
            if (def.rotation) Matter.Body.setAngle(body, def.rotation);
            break;

          case 'rect':
            body = Matter.Bodies.rectangle(x, y, def.width * sx, def.height * sy, shapeOpts);
            if (def.rotation) Matter.Body.setAngle(body, def.rotation);
            break;

          default:
            console.warn('[gemskorn-physics] Unknown shape type:', def.type);
            return;
        }

        if (!body) return;

        const shape = {
          ...def,
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
      const t = 100; // wall thickness
      const opts = { isStatic: true, friction: 0.1, restitution: 0.2 };

      this._walls = [
        Matter.Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, opts), // floor
        Matter.Bodies.rectangle(-t / 2, h / 2, t, h * 2, opts), // left
        Matter.Bodies.rectangle(w + t / 2, h / 2, t, h * 2, opts), // right
        Matter.Bodies.rectangle(w / 2, -h - t / 2, w + t * 2, t, opts), // ceiling far above
      ];
      Matter.Composite.add(this._world, this._walls);
    }

    _initInput(Matter) {
      const mouse = Matter.Mouse.create(this._canvas);
      // Match canvas DPR so click positions land correctly.
      mouse.pixelRatio = this._dpr;

      this._mouseConstraint = Matter.MouseConstraint.create(this._engine, {
        mouse,
        constraint: {
          stiffness: 0.2,
          damping: 0.1,
          render: { visible: false },
        },
      });
      Matter.Composite.add(this._world, this._mouseConstraint);

      // Allow page scroll over the canvas — Matter binds wheel events that block scroll.
      const passive = { passive: true };
      this._canvas.removeEventListener('wheel', mouse.mousewheel);
      this._canvas.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      this._canvas.addEventListener('wheel', () => {}, passive);
    }

    _initResize() {
      this._resizeObserver = new ResizeObserver(() => {
        if (!this._engine) return;
        this._rebuild();
      });
      this._resizeObserver.observe(this);
    }

    // Rebuild physics on size change (cheaper + cleaner than rescaling bodies).
    _rebuild() {
      const Matter = this._Matter;
      // Clear bodies but keep engine
      Matter.Composite.clear(this._world, false, true);
      this._shapes = [];
      this._walls = [];
      this._measure();
      this._buildShapes();
      this._buildWalls();
      // Re-add mouse constraint
      if (this._mouseConstraint) {
        Matter.Composite.add(this._world, this._mouseConstraint);
      }
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
        const renderer = RENDERERS[shape.type];
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
