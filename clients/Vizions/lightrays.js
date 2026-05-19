import { Renderer, Program, Triangle, Mesh } from "https://esm.sh/ogl";

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [
        parseInt(m[1], 16) / 255,
        parseInt(m[2], 16) / 255,
        parseInt(m[3], 16) / 255,
      ]
    : [1, 1, 1];
};

const getAnchorAndDir = (origin, w, h) => {
  const outside = 0.2;
  switch (origin) {
    case "top-left":
      return { anchor: [0.25 * w, -outside * h], dir: [1, 0.75] };
    case "top-right":
      return { anchor: [w, -outside * h], dir: [-0.5, 0.5] };
    case "bottom-left":
      return { anchor: [0, (1 + outside) * h], dir: [0.5, -0.5] };
    case "bottom-right":
      return { anchor: [w, (1 + outside) * h], dir: [-0.5, -0.5] };
    case "left":
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case "right":
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    default:
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

class LightRays {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    this.config = {
      raysOrigin: "top-center",
      raysColor: "#ffffff",
      raysSpeed: 1,
      lightSpread: 1,
      rayLength: 2,
      pulsating: false,
      fadeDistance: 1.0,
      saturation: 1.0,
      followMouse: false,
      mouseInfluence: 0.1,
      noiseAmount: 0.0,
      distortion: 0.0,
      ...options,
    };

    this.mouse = { x: 0.5, y: 0.5 };
    this.smoothMouse = { x: 0.5, y: 0.5 };
    this.isVisible = false;
    this.init();
  }

  init() {
    if (!this.container) return;

    this.renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
    });
    this.gl = this.renderer.gl;
    this.container.appendChild(this.gl.canvas);
    this.gl.canvas.style.width = "100%";
    this.gl.canvas.style.height = "100%";

    const vert = `attribute vec2 position; varying vec2 vUv; void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;
    const frag = `
                    precision highp float;
                    uniform float iTime; uniform vec2 iResolution; uniform vec2 rayPos; uniform vec2 rayDir; uniform vec3 raysColor;
                    uniform float raysSpeed; uniform float lightSpread; uniform float rayLength; uniform float pulsating;
                    uniform float fadeDistance; uniform float saturation; uniform vec2 mousePos; uniform float mouseInfluence;
                    uniform float noiseAmount; uniform float distortion;

                    float noise(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }

                    float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
                        vec2 sourceToCoord = coord - raySource;
                        vec2 dirNorm = normalize(sourceToCoord);
                        float cosAngle = dot(dirNorm, rayRefDirection);
                        float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
                        float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
                        float distance = length(sourceToCoord);
                        float maxDistance = iResolution.x * rayLength;
                        float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
                        float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
                        float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
                        float baseStrength = clamp((0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)), 0.0, 1.0);
                        return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
                    }

                    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                        vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
                        vec2 finalRayDir = rayDir;
                        if (mouseInfluence > 0.0) {
                            vec2 mouseScreenPos = mousePos * iResolution.xy;
                            vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
                            finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
                        }
                        vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
                        vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
                        fragColor = rays1 * 0.5 + rays2 * 0.4;
                        if (noiseAmount > 0.0) { float n = noise(coord * 0.01 + iTime * 0.1); fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n); }
                        float brightness = 1.0 - (coord.y / iResolution.y);
                        fragColor.x *= 0.1 + brightness * 0.8; fragColor.y *= 0.3 + brightness * 0.6; fragColor.z *= 0.5 + brightness * 0.5;
                        if (saturation != 1.0) { float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114)); fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation); }
                        fragColor.rgb *= raysColor;
                    }
                    void main() { vec4 color; mainImage(color, gl_FragCoord.xy); gl_FragColor = color; }
                `;

    this.uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      rayPos: { value: [0, 0] },
      rayDir: { value: [0, 1] },
      raysColor: { value: hexToRgb(this.config.raysColor) },
      raysSpeed: { value: this.config.raysSpeed },
      lightSpread: { value: this.config.lightSpread },
      rayLength: { value: this.config.rayLength },
      pulsating: { value: this.config.pulsating ? 1.0 : 0.0 },
      fadeDistance: { value: this.config.fadeDistance },
      saturation: { value: this.config.saturation },
      mousePos: { value: [0.5, 0.5] },
      mouseInfluence: { value: this.config.mouseInfluence },
      noiseAmount: { value: this.config.noiseAmount },
      distortion: { value: this.config.distortion },
    };

    const geometry = new Triangle(this.gl);
    this.program = new Program(this.gl, {
      vertex: vert,
      fragment: frag,
      uniforms: this.uniforms,
    });
    this.mesh = new Mesh(this.gl, { geometry, program: this.program });

    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();

    if (this.config.followMouse) {
      this.handleMouseMove = this.handleMouseMove.bind(this);
      window.addEventListener("mousemove", this.handleMouseMove);
    }

    this.observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible) this.loop();
    });
    this.observer.observe(this.container);

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    if (!this.container) return;
    const { clientWidth: w, clientHeight: h } = this.container;
    this.renderer.setSize(w, h);
    const dpr = this.renderer.dpr;
    this.uniforms.iResolution.value = [w * dpr, h * dpr];
    const { anchor, dir } = getAnchorAndDir(
      this.config.raysOrigin,
      w * dpr,
      h * dpr
    );
    this.uniforms.rayPos.value = anchor;
    this.uniforms.rayDir.value = dir;
  }

  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    this.mouse = { x, y };
  }

  loop(t) {
    if (!this.isVisible) return;
    this.uniforms.iTime.value = t * 0.001;
    if (this.config.followMouse && this.config.mouseInfluence > 0) {
      const smoothing = 0.92;
      this.smoothMouse.x =
        this.smoothMouse.x * smoothing + this.mouse.x * (1 - smoothing);
      this.smoothMouse.y =
        this.smoothMouse.y * smoothing + this.mouse.y * (1 - smoothing);
      this.uniforms.mousePos.value = [this.smoothMouse.x, this.smoothMouse.y];
    }
    this.renderer.render({ scene: this.mesh });
    requestAnimationFrame(this.loop);
  }
}

if (window.innerWidth > 768) {
  const rays = new LightRays(".lightrays_wrap", {
    raysOrigin: "top-left",
    raysColor: "#C65BED",
    raysSpeed: 0.5,
    lightSpread: 1,
    rayLength: 0.6,
    mouseInfluence: 0.1,
  });
}
