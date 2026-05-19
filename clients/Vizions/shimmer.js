let scene, camera, renderer, points;

function init() {
  const canvasElement = document.querySelector('[data-canvas="shimmer"]');

  if (!canvasElement) {
    console.error("Canvas with data-canvas='shimmer' not found!");
    return;
  }

  // 1. Detect Mobile
  const isMobile = window.innerWidth < 768;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 60;

  renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    antialias: !isMobile,
    alpha: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const countX = isMobile ? 200 : 1200;
  const countY = isMobile ? 400 : 280;

  const spacing = isMobile ? 0.35 : 0.25;

  const totalPoints = countX * countY;
  const positions = new Float32Array(totalPoints * 3);
  const randomOffsets = new Float32Array(totalPoints);

  for (let i = 0; i < countX; i++) {
    for (let j = 0; j < countY; j++) {
      const idx = i * countY + j;

      positions[idx * 3] = (i - countX / 2) * spacing;
      positions[idx * 3 + 1] = (j - countY / 2) * spacing;
      positions[idx * 3 + 2] = 0;

      randomOffsets[idx] = Math.random() * Math.PI * 2;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("offset", new THREE.BufferAttribute(randomOffsets, 1));

  const pointSizeMultiplier = isMobile ? 200.0 : 150.0;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#FFFFFF") },
    },
    vertexShader: `
                uniform float uTime;
                attribute float offset;
                varying float vShimmer;

                void main() {
                    vec3 pos = position;

                    float shimmer = sin(uTime * 2.5 + offset) * 0.5 + 0.5;
                    shimmer = pow(shimmer, 3.0); 

                    vShimmer = shimmer;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

                    // Dynamic size injection
                    gl_PointSize = (${pointSizeMultiplier.toFixed(
                      1
                    )} / -mvPosition.z) * (0.8 + vShimmer * 1.2);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
    fragmentShader: `
                uniform vec3 uColor;
                varying float vShimmer;

                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5));
                    if (r > 0.5) discard;

                    float alpha = smoothstep(0.5, 0.2, r) * (0.15 + vShimmer * 0.85);
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.001;
  if (points) {
    points.material.uniforms.uTime.value = time;
  }
  if (renderer) {
    renderer.render(scene, camera);
  }
}

window.onload = () => {
  if (window.innerWidth > 768) {
    init();
    animate();
  }
};
