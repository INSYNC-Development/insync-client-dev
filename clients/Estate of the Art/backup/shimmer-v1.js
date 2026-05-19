let scene, camera, renderer, points;

function init() {
  const canvas = document.querySelector('[data-canvas="shimmer"]');

  if (!canvas) {
    console.error('Canvas with attribute data-canvas="shimmer" not found.');
    return;
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 60;

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const spacing = 0.5;
  const countX = 240;
  const countY = 140;
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

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#FFDCA8") },
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
                        gl_PointSize = (150.0 / -mvPosition.z) * (1.0 + vShimmer * 1.5);
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.001;
  points.material.uniforms.uTime.value = time;
  renderer.render(scene, camera);
}

window.onload = () => {
  init();
  animate();
};
