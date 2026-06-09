// 3D-сцена для секції "ключка у 3D". використовує Three.js — бібліотеку для WebGL.
// показує тривимірну модель хокейної клюшки яка обертається і реагує на курсор миші
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // завантажувач 3D-моделей формату glTF/GLB

// шлях до файлу з 3D-моделлю клюшки (формат GLB — бінарний glTF, компактний)
const MODEL_URL = '3d/hockey_stick-2.glb';

function initStick3D() {
  const container = document.getElementById('puck3d');
  if (!container) return;

  // розміри контейнера. fallback 400x360 на випадок коли CSS ще не застосувався
  const w = container.clientWidth || 400;
  const h = container.clientHeight || 360;
  // сцена — це 3D-простір де живуть обʼєкти (як театральна сцена)
  const scene = new THREE.Scene();

  // PerspectiveCamera: 38 — кут огляду (як ширококутний обʼєктив фотоапарата),
  // 0.1 та 200 — ближня і дальня площини відсікання (що ближче і що далі за ці значення — не рендериться).
  // position.set(0,0,6) — камера стоїть на 6 одиниць перед сценою
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);
  camera.position.set(0, 0, 6);

  // WebGLRenderer — рендерить сцену через WebGL у canvas.
  // alpha:true — прозорий фон щоб видно було сторінку за canvas, antialias:true — згладження країв
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  // обмеження pixelRatio до 2 — на retina-екранах не рендерити 4х пікселів даремно (економія GPU)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);                              // прозорий фон
  renderer.outputColorSpace = THREE.SRGBColorSpace;                  // правильний колірний простір (sRGB)
  renderer.toneMapping = THREE.ACESFilmicToneMapping;                // кіношний tone mapping (як у фільмах)
  renderer.toneMappingExposure = 1.2;                                // експозиція — трохи світліше дефолту
  container.appendChild(renderer.domElement);

  // освітлення сцени за принципом 3-точкового світла (як у фотостудії):
  // key — основне яскраве світло справа зверху
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(4, 5, 6);
  scene.add(key);

  // rim — червоне підсвічування з боку для контурного ефекту (у дусі бренду)
  const rim = new THREE.DirectionalLight(0xe62e2e, 1.0);
  rim.position.set(-5, -2, -4);
  scene.add(rim);

  // fill — золотисте мʼяке заповнююче світло щоб усунути різкі тіні
  const fill = new THREE.DirectionalLight(0xc9a84c, 0.8);
  fill.position.set(-3, 4, 3);
  scene.add(fill);

  // ambient — рівномірне фонове світло щоб не було повністю чорних областей
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  // плейсхолдер у вигляді золотого кільця — показуємо доки модель ключки завантажується
  // (GLB-файл декілька МБ, на повільному інтернеті може секунду тягтись)
  const placeholder = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.1, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 0.9, roughness: 0.2 })
  );
  scene.add(placeholder);

  // Group — контейнер який обʼєднує обʼєкти. зручно крутити одразу всю групу
  const stickGroup = new THREE.Group();
  scene.add(stickGroup);

  let modelLoaded = false;

  // завантажуємо 3D-модель асинхронно. callback викликається коли модель готова
  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      // видаляємо плейсхолдер і звільняємо памʼять (важливо для WebGL — інакше витоки)
      scene.remove(placeholder);
      placeholder.geometry.dispose();
      placeholder.material.dispose();

      const model = gltf.scene;

      // центруємо модель: Box3 рахує bounding box, потім зсуваємо модель щоб центр був у (0,0,0)
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      // масштабуємо щоб найбільша сторона = 3.6 одиниць (модель завжди займає однаковий обʼєм незалежно від оригінального розміру)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.6 / maxDim;
      model.scale.setScalar(scale);

      // початковий поворот: трохи нахилу + кут 36° (Math.PI/5) для красивої композиції
      stickGroup.rotation.set(0.15, 0, Math.PI / 5);
      stickGroup.add(model);

      modelLoaded = true;
    },
    undefined,
    (err) => {
      // якщо модель не завантажилась — просто лог, плейсхолдер залишиться крутитись
      console.warn('GLB load error:', err);
    }
  );

  // реакція на курсор. зберігаємо цільові кути обертання — куди треба повернути модель.
  // нормалізуємо координати до діапазону [-0.5, 0.5] і множимо на чутливість (1.2 для Y, 0.5 для X)
  let targetRotY = 0, targetRotX = 0;
  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 1.2;
    targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
  });

  let autoY = 0;

  // головний цикл рендеру. requestAnimationFrame викликає функцію щокадру (~60 разів на секунду)
  function animate() {
    requestAnimationFrame(animate);

    if (modelLoaded) {
      // модель повільно крутиться сама (autoY += 0.008) + додатковий нахил за курсором.
      // на X-осі використовуємо easing (повільне наближення до target) щоб обертання було плавне
      autoY += 0.008;
      stickGroup.rotation.y = autoY + targetRotY * 0.4;
      stickGroup.rotation.x += (0.15 + targetRotX * 0.3 - stickGroup.rotation.x) * 0.06;
    } else {
      // доки модель завантажується — крутимо плейсхолдер-кільце
      placeholder.rotation.x += 0.02;
      placeholder.rotation.y += 0.03;
    }

    // фактичний рендер: береш сцену з усіма обʼєктами і малюєш через камеру
    renderer.render(scene, camera);
  }
  animate();

  // адаптація при зміні розміру вікна (resize). треба оновити пропорції камери і розмір canvas
  window.addEventListener('resize', () => {
    const nw = container.clientWidth;
    const nh = container.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });
}

// запускаємо ініціалізацію. якщо DOM ще не готовий — чекаємо DOMContentLoaded, інакше — одразу
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStick3D);
} else {
  initStick3D();
}
