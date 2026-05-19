class TouchTexture {
  constructor() {
    this.size = 64;
    this.width = this.height = this.size;
    this.maxAge = 120;
    this.radius = 0.15 * this.size;
    this.speed = 1 / this.maxAge;
    this.trail = [];
    this.last = null;
    this.initTexture();
  }

  initTexture() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.clear();
    let speed = this.speed;
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i];
      point.vy -= 0.005;
      point.vx *= 0.98;
      point.vy *= 0.98;

      let f = point.force * speed * (1 - point.age / this.maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f * 0.5;
      point.age++;

      if (point.age > this.maxAge) {
        this.trail.splice(i, 1);
      } else {
        this.drawPoint(point);
      }
    }
    this.texture.needsUpdate = true;
  }

  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addTouch(point) {
    let force = 0;
    let vx = 0;
    let vy = 0;
    const last = this.last;
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      let d = Math.sqrt(dd);
      vx = dx / d;
      vy = dy / d;
      force = Math.min(dd * 10000, 1.0);
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  drawPoint(point) {
    const pos = {
      x: point.x * this.width,
      y: (1 - point.y) * this.height,
    };
    let intensity = 1;
    if (point.age < this.maxAge * 0.3) {
      intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
    } else {
      const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
      intensity = -t * (t - 2);
    }
    intensity *= point.force;
    const radius = this.radius;
    let color = `${((point.vx + 1) / 2) * 255}, ${
      ((point.vy + 1) / 2) * 255
    }, ${intensity * 255}`;
    let offset = this.size * 5;
    this.ctx.shadowOffsetX = offset;
    this.ctx.shadowOffsetY = offset;
    this.ctx.shadowBlur = radius * 1;
    this.ctx.shadowColor = `rgba(${color},${0.1 * intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,0.8)";
    this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

class GradientBackground {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.mesh = null;

    const colorPeach = new THREE.Vector3(1.0, 0.733, 0.431);
    const colorSalmon = new THREE.Vector3(0.976, 0.67, 0.466);
    const colorRim = new THREE.Vector3(0.8, 0.3, 0.1);

    this.uniforms = {
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uColor1: { value: colorPeach },
      uColor2: { value: colorSalmon },
      uColorRim: { value: colorRim },
      uTouchTexture: { value: null },
    };
  }

  init() {
    const viewSize = this.sceneManager.getViewSize();
    const geometry = new THREE.PlaneGeometry(
      viewSize.width,
      viewSize.height,
      1,
      1
    );

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        vUv = uv;
                    }
                `,
      fragmentShader: `
                    uniform float uTime;
                    uniform vec2 uResolution;
                    uniform vec3 uColor1;
                    uniform vec3 uColor2;
                    uniform vec3 uColorRim;
                    uniform sampler2D uTouchTexture;
                    
                    varying vec2 vUv;

                    float noise(vec2 uv) {
                        return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
                    }

                    void main() {
                        vec2 uv = vUv;
                        
                        vec4 touch = texture2D(uTouchTexture, uv);
                        float distIntensity = touch.b;

                        uv.x += (touch.r * 2.0 - 1.0) * 0.05 * distIntensity;
                        uv.y += (touch.g * 2.0 - 1.0) * 0.05 * distIntensity;

                        vec2 center = vec2(0.5, 0.0);
                        center.x += sin(uTime * 0.5) * 0.1;
                        
                        vec2 left = vec2(0.2, -0.05);
                        left.x += cos(uTime * 0.3) * 0.1;

                        vec2 right = vec2(0.8, -0.05);
                        right.x += sin(uTime * 0.4) * 0.1;

                        float d1 = length(((uv - center) * 0.5) * vec2(1.0, 2.0)); 
                        float d2 = length((uv - left) * vec2(1.0, 2.5));
                        float d3 = length((uv - right) * vec2(1.0, 2.5));

                        float glow1 = smoothstep(2.5, 0.0, d1); 
                        float glow2 = smoothstep(2.0, 0.0, d2);
                        float glow3 = smoothstep(2.0, 0.0, d3);

                        float totalGlow = glow1 + glow2 * 0.5 + glow3 * 0.5;
                        vec3 baseColor = mix(uColor2, uColor1, glow1);

                        // TINGGI: Mengubah 0.9 menjadi 0.5 menurunkan posisi cairan
                        float mask = 1.0 - smoothstep(0.0, 0.5, uv.y);
                        
                        // Warna: Hitam di atas, Gradien di bawah
                        vec3 colorWithBlackTop = mix(vec3(0.0), baseColor, mask);

                        // OPASITAS: Ubah 0.7 untuk mengatur seberapa transparan cairannya
                        float opacityLevel = 0.9; 
                        float alpha = mix(1.0, opacityLevel, mask * totalGlow);

                        gl_FragColor = vec4(colorWithBlackTop, alpha);
                    }
                `,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.sceneManager.scene.add(this.mesh);
  }

  update(delta) {
    this.uniforms.uTime.value += delta;
  }

  onResize(width, height) {
    const viewSize = this.sceneManager.getViewSize();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(
        viewSize.width,
        viewSize.height,
        1,
        1
      );
    }
    this.uniforms.uResolution.value.set(width, height);
  }
}

class App {
  constructor() {
    const canvas = document.querySelector('canvas[data-canvas="hero"]');
    if (!canvas) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    this.scene = new THREE.Scene();
    // this.scene.background = new THREE.Color(0x000000); // DELETED

    this.clock = new THREE.Clock();
    this.touchTexture = new TouchTexture();
    this.gradientBackground = new GradientBackground(this);
    this.gradientBackground.uniforms.uTouchTexture.value =
      this.touchTexture.texture;

    this.init();
  }

  init() {
    this.gradientBackground.init();
    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("mousemove", (ev) => this.onMouseMove(ev));
    window.addEventListener("touchmove", (ev) => this.onTouchMove(ev));
    this.tick();
  }

  onTouchMove(ev) {
    const touch = ev.touches[0];
    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  onMouseMove(ev) {
    this.touchTexture.addTouch({
      x: ev.clientX / window.innerWidth,
      y: 1 - ev.clientY / window.innerHeight,
    });
  }

  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2
    );
    return { width: height * this.camera.aspect, height };
  }

  update(delta) {
    this.touchTexture.update();
    this.gradientBackground.update(delta);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  tick() {
    this.render();
    this.update(this.clock.getDelta());
    requestAnimationFrame(() => this.tick());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.gradientBackground.onResize(window.innerWidth, window.innerHeight);
  }
}

new App();
