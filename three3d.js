import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = '3d/hockey_stick-2.glb';

function initStick3D() {
  const container = document.getElementById('puck3d');
  if (!container) return;

  const w = container.clientWidth || 400;
  const h = container.clientHeight || 360;
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Lights
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(4, 5, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xe62e2e, 1.0);
  rim.position.set(-5, -2, -4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xc9a84c, 0.8);
  fill.position.set(-3, 4, 3);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  // Visible placeholder torus while loading
  const placeholder = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.1, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 0.9, roughness: 0.2 })
  );
  scene.add(placeholder);

  const stickGroup = new THREE.Group();
  scene.add(stickGroup);

  let modelLoaded = false;

  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      scene.remove(placeholder);
      placeholder.geometry.dispose();
      placeholder.material.dispose();

      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.6 / maxDim;
      model.scale.setScalar(scale);

      stickGroup.rotation.set(0.15, 0, Math.PI / 5);
      stickGroup.add(model);

      modelLoaded = true;
    },
    undefined,
    (err) => {
      console.warn('GLB load error:', err);
    }
  );

  // Mouse-follow
  let targetRotY = 0, targetRotX = 0;
  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 1.2;
    targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
  });

  let autoY = 0;

  function animate() {
    requestAnimationFrame(animate);

    if (modelLoaded) {
      autoY += 0.008;
      stickGroup.rotation.y = autoY + targetRotY * 0.4;
      stickGroup.rotation.x += (0.15 + targetRotX * 0.3 - stickGroup.rotation.x) * 0.06;
    } else {
      placeholder.rotation.x += 0.02;
      placeholder.rotation.y += 0.03;
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const nw = container.clientWidth;
    const nh = container.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStick3D);
} else {
  initStick3D();
}
