import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvases = Array.from(document.querySelectorAll("[data-dna-scene]"));

if (canvases.length) {
  document.body.classList.add("three-loading");
  const scenes = canvases
    .map((canvas) => {
      try {
        return createDnaScene(canvas);
      } catch (error) {
        console.warn("Three.js DNA scene failed, keeping SVG fallback.", error);
        return null;
      }
    })
    .filter(Boolean);
  if (scenes.length) document.body.classList.add("three-ready");
}

function createDnaScene(canvas) {
  const mode = canvas.dataset.dnaScene;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  const root = new THREE.Group();
  scene.add(root);

  const strandA = new THREE.MeshStandardMaterial({
    color: 0x6fe8da,
    emissive: 0x1a8f8c,
    emissiveIntensity: 0.56,
    metalness: 0.22,
    roughness: 0.24
  });
  const strandB = new THREE.MeshStandardMaterial({
    color: 0xa04e68,
    emissive: 0x5f1830,
    emissiveIntensity: 0.48,
    metalness: 0.18,
    roughness: 0.28
  });
  const rungMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8fffb,
    emissive: 0x245e6a,
    emissiveIntensity: 0.28,
    metalness: 0.12,
    roughness: 0.42,
    transparent: true,
    opacity: 0.74
  });
  const nodeMaterials = [
    makeNodeMaterial(0x8be8d1, 0x1a8f8c),
    makeNodeMaterial(0xf4d485, 0x9b7326),
    makeNodeMaterial(0x63c7dc, 0x1e7186),
    makeNodeMaterial(0xa04e68, 0x70243a)
  ];

  const dna = buildDna({
    height: mode === "opener" ? 9.4 : 22,
    turns: mode === "opener" ? 3.6 : 8.6,
    radius: mode === "opener" ? 1.18 : 1.36,
    strandA,
    strandB,
    rungMaterial,
    nodeMaterials,
    segments: mode === "opener" ? 150 : 320
  });
  root.add(dna.group);

  const particles = buildParticles(mode === "opener" ? 76 : 150, mode === "opener" ? 8 : 15);
  root.add(particles);

  const keyLights = [
    new THREE.PointLight(0x8be8d1, 34, 20),
    new THREE.PointLight(0xa04e68, 18, 18),
    new THREE.AmbientLight(0xbfeee9, 0.52)
  ];
  keyLights[0].position.set(-3.8, 3.2, 5);
  keyLights[1].position.set(4.4, -2.8, 3);
  keyLights.forEach((light) => scene.add(light));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function getProgress() {
    const corridor = document.querySelector(".genome-corridor");
    if (mode === "opener") {
      const opener = document.querySelector(".opener-screen");
      if (!opener) return 0;
      const rect = opener.getBoundingClientRect();
      return clamp(-rect.top / Math.max(1, rect.height * 0.7));
    }
    if (!corridor) return 0;
    const rect = corridor.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
  }

  function render(time = 0) {
    resize();
    const progress = getProgress();
    const clock = prefersReducedMotion ? 0 : time * 0.001;
    const compact = window.innerWidth < 760;

    if (mode === "opener") {
      root.rotation.set(-0.18, -0.62 + progress * 0.5 + clock * 0.05, 0.12);
      root.position.set(compact ? 1.1 : 1.6, 0.1 - progress * 0.9, 0);
      camera.position.set(0, 0, compact ? 8.8 : 7.3);
      camera.lookAt(0, 0, 0);
    } else {
      root.rotation.set(0.88, -0.34 + progress * 3.8 + clock * 0.05, -0.28);
      root.position.set(0, progress * 8.5 - 3.2, 0);
      camera.position.set(compact ? 0.4 : 0, compact ? 0.7 : 0, compact ? 11.8 : 9.2);
      camera.lookAt(0, progress * 2.2, 0);
    }

    particles.rotation.y = clock * 0.06;
    dna.group.children.forEach((child, index) => {
      if (!child.userData.pulse) return;
      child.scale.setScalar(1 + Math.sin(clock * 2.2 + index * 0.32) * 0.08);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize);
  resize();
  render();
}

function buildDna(options) {
  const { height, turns, radius, segments, strandA, strandB, rungMaterial, nodeMaterials } = options;
  const group = new THREE.Group();
  const pathA = [];
  const pathB = [];
  const nodeGeometry = new THREE.SphereGeometry(0.115, 22, 16);
  const rungGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1, 10);

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const angle = t * Math.PI * 2 * turns;
    const y = (t - 0.5) * height;
    pathA.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    pathB.push(new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius));
  }

  const curveA = new THREE.CatmullRomCurve3(pathA);
  const curveB = new THREE.CatmullRomCurve3(pathB);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curveA, segments, 0.045, 14, false), strandA));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curveB, segments, 0.045, 14, false), strandB));

  const rungCount = Math.floor(turns * 5);
  for (let index = 0; index < rungCount; index += 1) {
    const t = (index + 0.5) / rungCount;
    const pointA = curveA.getPoint(t);
    const pointB = curveB.getPoint(t);
    const rung = new THREE.Mesh(rungGeometry, rungMaterial);
    placeCylinderBetween(rung, pointA, pointB);
    group.add(rung);

    [pointA, pointB].forEach((point, nodeIndex) => {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterials[(index + nodeIndex) % nodeMaterials.length]);
      node.position.copy(point);
      node.userData.pulse = true;
      group.add(node);
    });
  }

  return { group };
}

function buildParticles(count, range) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * range;
    positions[index * 3 + 1] = (Math.random() - 0.5) * range * 1.7;
    positions[index * 3 + 2] = (Math.random() - 0.5) * range;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0x8be8d1,
      size: 0.035,
      transparent: true,
      opacity: 0.44,
      depthWrite: false
    })
  );
}

function makeNodeMaterial(color, emissive) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.58,
    metalness: 0.16,
    roughness: 0.22
  });
}

function placeCylinderBetween(mesh, start, end) {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(end, start);
  mesh.position.copy(midpoint);
  mesh.scale.set(1, direction.length(), 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}
