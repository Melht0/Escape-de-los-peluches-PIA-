import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = (s) => document.querySelector(s);
const stage = $('#stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#17100e');
scene.fog = new THREE.Fog('#17100e', 42, 90);
const camera = new THREE.PerspectiveCamera(37, innerWidth / innerHeight, 0.1, 180);
camera.position.set(0, 25, 34);
camera.fov = 34;
camera.lookAt(0, 0.8, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
stage.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffe6c8, 0x35231c, 2.15));
const sun = new THREE.DirectionalLight(0xffd09a, 3.2);
sun.position.set(-15, 28, 20); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
scene.add(sun);
const warm = new THREE.PointLight(0xffa94d, 150, 55); warm.position.set(0, 12, 0); scene.add(warm);

const loader = new GLTFLoader();
const clock = new THREE.Clock();
const root = new THREE.Group(); scene.add(root);
const roomGroups = {};
const roomInfo = {
  bed: { file: 'Habitacion.glb', title: 'PISO 3 · HABITACIÓN', objective: 'Explora la habitación y encuentra la primera llave', center: [-8, -7], spawn: [-1.6, 0, 2.3], key: [-2.6, 0.22, 1.7], target: 'cama' },
  kitchen: { file: 'Cocina.glb', title: 'PISO 2 · COCINA', objective: 'Explora la cocina. El conejo puede ayudarte a avanzar', center: [8, -7], spawn: [-1.65, 0, 1.35], key: [-0.65, 2.05, -4.15], target: 'repisa' },
  living: { file: 'Sala.glb', title: 'PISO 1 · SALA', objective: 'Explora la sala y encuentra la última llave', center: [0, 7], spawn: [-3.1, 0, 2.5], key: [3.5, 0.8, 1.3], target: 'taza' }
};
const roomSizes = {};
const colliders = { bed: [], kitchen: [], living: [] };
const material = (color, roughness = .7, metalness = .25) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const bronze = material('#9b5729', .42, .62);
const darkBase = material('#261711', .75, .25);

function addBox(parent, name, x, y, z, w, h, d, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.name = name; mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}

function makePlatform(id, width, depth, cx, cz) {
  const platform = new THREE.Group(); platform.position.set(cx, 0, cz); root.add(platform);
  addBox(platform, `${id}-foundation`, 0, -.42, 0, width + .9, .72, depth + .9, darkBase);
  const edge = .24;
  for (const [x,z,w,d] of [[0,-depth/2,width+1,edge],[0,depth/2,width+1,edge],[-width/2,0,edge,depth],[width/2,0,edge,depth]]) {
    addBox(platform, `${id}-bronze-frame`, x, -.02, z, w, .35, d, bronze);
  }
  for (let i = -1; i <= 1; i++) {
    const lamp = new THREE.PointLight(0xffa13d, 13, 6);
    lamp.position.set(i * width * .31, .4, -depth/2 - .2); platform.add(lamp);
  }
}

function normalizeRoom(gltfScene, id) {
  const model = gltfScene;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const horizontal = Math.max(size.x, size.z, .001);
  const scale = 13.2 / horizontal;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const scaledBounds = new THREE.Box3().setFromObject(model);
  const scaledSize = scaledBounds.getSize(new THREE.Vector3());
  model.position.x -= (scaledBounds.min.x + scaledBounds.max.x) / 2;
  model.position.z -= (scaledBounds.min.z + scaledBounds.max.z) / 2;
  model.position.y -= scaledBounds.min.y;
  model.updateMatrixWorld(true);
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true; obj.receiveShadow = true;
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) { m.side = THREE.DoubleSide; if ('roughness' in m && m.roughness < .18) m.roughness = .22; }
    }
  });
  const { center } = roomInfo[id];
  const group = new THREE.Group(); group.position.set(center[0], 0, center[1]);
  // La sala se gira para que su abertura y su interior miren hacia la cámara.
  if (id === 'living') group.rotation.y = Math.PI;
  group.add(model); root.add(group);
  roomGroups[id] = group;
  roomSizes[id] = { width: scaledSize.x, depth: scaledSize.z, height: scaledSize.y };
  makePlatform(id, Math.max(scaledSize.x, 10.8), Math.max(scaledSize.z, 8.8), center[0], center[1]);
  // Conservative collision boxes from furniture meshes only; original model geometry is untouched.
  model.updateMatrixWorld(true);
  const furnitureWords = /(cama|bed|mesa|table|silla|chair|refriger|mueble|sofa|sill[oó]n|armario|tele|tv|caj[oó]n|gabinete|estante|c[oó]moda)/i;
  model.traverse((obj) => {
    if (!obj.isMesh || !furnitureWords.test(obj.name)) return;
    const b = new THREE.Box3().setFromObject(obj);
    const s = b.getSize(new THREE.Vector3());
    if (s.x > .35 && s.z > .35 && s.x < 7 && s.z < 7 && s.y > .25) {
      colliders[id].push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z });
    }
  });
}

const actors = { cow: null, bunny: null, bear: null };
const player = new THREE.Group(); scene.add(player);
const buddy = new THREE.Group(); scene.add(buddy);
const bear = new THREE.Group(); scene.add(bear);
function normalizeActor(model, height) {
  model.updateMatrixWorld(true);
  let b = new THREE.Box3().setFromObject(model);
  const s = b.getSize(new THREE.Vector3());
  model.scale.setScalar(height / Math.max(s.y, .001));
  model.updateMatrixWorld(true);
  b = new THREE.Box3().setFromObject(model);
  model.position.y -= b.min.y;
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => m.side = THREE.DoubleSide); } } });
  return model;
}

function makeKey(color) {
  const group = new THREE.Group();
  const gold = material(color, .28, .7);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.18, .055, 10, 24), gold); ring.position.x = -.18; group.add(ring);
  const shaft = addBox(group, 'key-shaft', .16, 0, 0, .48, .09, .09, gold);
  const tooth = addBox(group, 'key-tooth', .35, -.09, 0, .09, .18, .09, gold);
  group.userData.float = true; return group;
}
const keys3D = { gold: makeKey('#efb33f'), blue: makeKey('#58a8e9'), green: makeKey('#6ab66a') };
for (const k of Object.values(keys3D)) scene.add(k);

let active = 'bed', started = false, paused = false, caught = false, finale = false;
let elapsed = 0, toastTimer = null, doorAttempts = 0, exitDoor = null, doorUsePoint = null, finaleStartedAt = 0, finaleCowStart = null, finaleBunnyStart = null;
const collected = { gold: false, blue: false, green: false };
const keyPositions = {};
const keyToRoom = { gold: 'bed', blue: 'kitchen', green: 'living' };
function worldPoint(id, local) {
  const group = roomGroups[id];
  if (!group) { const c = roomInfo[id].center; return new THREE.Vector3(c[0] + local[0], local[1], c[1] + local[2]); }
  return group.localToWorld(new THREE.Vector3(local[0], local[1], local[2]));
}
for (const [key, id] of Object.entries(keyToRoom)) keyPositions[key] = worldPoint(id, roomInfo[id].key);

function roomBounds(id) {
  const c = roomInfo[id].center, s = roomSizes[id] || { width: 13.2, depth: 10 };
  return { minX: c[0] - Math.max(s.width, 10.8)/2 + .65, maxX: c[0] + Math.max(s.width, 10.8)/2 - .65, minZ: c[1] - Math.max(s.depth, 8.8)/2 + .65, maxZ: c[1] + Math.max(s.depth, 8.8)/2 - .65 };
}
function blocked(id, x, z) {
  const b = roomBounds(id);
  if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return true;
  for (const o of colliders[id]) if (x > o.minX - .38 && x < o.maxX + .38 && z > o.minZ - .38 && z < o.maxZ + .38) return true;
  return false;
}
function showToast(text) {
  const el = $('#toast'); el.textContent = text; el.style.opacity = '1';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.style.opacity = '0', 2400);
}
function updateKeyUI() {
  for (const k of Object.keys(collected)) {
    const el = $(`[data-key="${k}"]`); el.classList.toggle('done', collected[k]);
    el.querySelector('small').textContent = collected[k] ? 'CONSEGUIDA' : 'PENDIENTE';
  }
}
function updateObjective() {
  let text = roomInfo[active].objective;
  if (active === 'bed' && collected.gold) text = 'Llave dorada conseguida. Dirígete a la cocina.';
  if (active === 'kitchen' && collected.blue) text = 'Llave azul conseguida. Continúa hacia la sala.';
  if (active === 'living' && Object.values(collected).every(Boolean)) text = 'Acércate a la puerta y presiona E para probar las llaves.';
  $('#objective').textContent = text;
}
function setRoom(id) {
  active = id;
  const c = roomInfo[id].center, s = roomInfo[id].spawn;
  player.position.copy(worldPoint(id, [s[0], 0, s[2]]));
  // En cocina el conejo aparece claramente junto a la vaca, sin quedar oculto tras la mesa.
  const buddyOffset = id === 'kitchen' ? [1.15, 0, .25] : [-.9, 0, .7];
  const buddyLocal = worldPoint(id, [s[0] + buddyOffset[0], 0, s[2] + buddyOffset[2]]);
  buddy.position.set(buddyLocal.x, 0, buddyLocal.z);
  if (actors.bear) { const bp = worldPoint(id, [4.7, 0, -3.3]); bear.position.set(bp.x, 0, bp.z); }
  $('#room-name').textContent = roomInfo[id].title;
  document.querySelectorAll('.floor-btn').forEach(b => b.classList.toggle('active', b.dataset.room === id));
  updateObjective();
}
function switchRoom(id) {
  if (id === active) return;
  if (id === 'kitchen' && !collected.gold) return showToast('La entrada a la cocina está cerrada. Encuentra primero la llave dorada.');
  if (id === 'living' && !collected.blue) return showToast('Necesitas la llave azul para entrar a la sala.');
  setRoom(id); showToast(`Entraste a ${id === 'bed' ? 'la habitación' : id === 'kitchen' ? 'la cocina' : 'la sala'}.`);
}
function distance(a,b) { return Math.hypot(a.x-b.x, a.z-b.z); }
function collectKey(key) {
  if (collected[key]) return;
  collected[key] = true; keys3D[key].visible = false; updateKeyUI(); updateObjective();
  const messages = { gold: '¡Encontraste la llave dorada debajo de la cama!', blue: '¡Encontraste la llave azul flotando sobre la repisa junto a la ventana!', green: '¡Encontraste la llave verde dentro de la taza!' };
  showToast(messages[key]);
  if (key === 'blue') buddy.position.set(player.position.x + .5, 0, player.position.z + .5);
}
function interact() {
  if (!started || paused || finale || caught) return;
  // Distancia horizontal: la altura de una llave flotante no afecta la interacción.
  const roomKey = Object.keys(keyToRoom).find(k => keyToRoom[k] === active && !collected[k]);
  if (roomKey && keyPositions[roomKey] && distance(player.position, keyPositions[roomKey]) <= 2.35) {
    collectKey(roomKey);
    return;
  }
  if (active === 'living' && Object.values(collected).every(Boolean)) {
    if (doorUsePoint && distance(player.position, doorUsePoint) <= 5.2) { testDoorKey(); return; }
    showToast('Ponte frente a la puerta de la sala y presiona E para probar una llave.');
    return;
  }
  showToast(roomKey ? 'Acércate un poco más a la llave y presiona E para recogerla.' : 'No hay objetos pendientes en este escenario.');
}
function testDoorKey() {
  const attempts = [
    { key: 'gold', message: 'La llave dorada no abre. Prueba con otra.' },
    { key: 'green', message: 'La llave verde tampoco funciona. Intenta con la última.' }
  ];
  if (doorAttempts < attempts.length) {
    showToast(attempts[doorAttempts].message);
    doorAttempts++;
    return;
  }
  startFinale();
}
function startFinale() {
  finale = true;
  finaleStartedAt = clock.elapsedTime;
  finaleCowStart = player.position.clone();
  finaleBunnyStart = buddy.position.clone();
  $('#objective').textContent = '¡La llave azul funciona! La vaca y el conejo están saliendo de la casa.';
  showToast('¡Clic! La llave azul abrió la puerta. ¡Escapen!');
  if (exitDoor) { exitDoor.userData.opening = true; exitDoor.userData.startRotation = exitDoor.rotation.y; }
}
function resetGame() {
  Object.keys(collected).forEach(k => { collected[k] = false; keys3D[k].visible = true; });
  doorAttempts = 0; if (exitDoor) { exitDoor.rotation.y = exitDoor.userData.startRotation || 0; exitDoor.userData.opening = false; }
  updateKeyUI(); elapsed = 0; finale = false; caught = false; paused = false; started = true;
  setRoom('bed'); $('#threat').style.display = 'none';
  $('#start').classList.add('hidden'); $('#pause').classList.add('hidden'); $('#caught').classList.add('hidden'); $('#ending').classList.add('hidden'); delete $('#ending').dataset.shown;
  showToast('Encuentra las tres llaves y evita al oso.');
}
function pauseGame(value) { paused = value; $('#pause').classList.toggle('hidden', !value); }

function findOriginalExitDoor() {
  // Se utiliza la puerta original que ya forma parte de Sala.glb.
  const group = roomGroups.living;
  let found = null;
  group.traverse(obj => { if (!found && obj.name && /puerta principal/i.test(obj.name)) found = obj; });
  exitDoor = found;
  if (!exitDoor) { console.warn('No se encontró Puerta principal en Sala.glb.'); doorUsePoint = null; return; }
  exitDoor.updateWorldMatrix(true, false);
  const bounds = new THREE.Box3().setFromObject(exitDoor);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  // El punto queda delante de la hoja, hacia el interior, para que sea alcanzable.
  const roomCenter = new THREE.Vector3(group.position.x, 0, group.position.z);
  const inward = new THREE.Vector3(roomCenter.x - center.x, 0, roomCenter.z - center.z).normalize();
  const halfDepth = Math.min(Math.max(size.x, size.z) * .5, 1.1);
  doorUsePoint = new THREE.Vector3(center.x, 0, center.z).addScaledVector(inward, halfDepth + 0.9);
}
function getExitDoorCenter() { return doorUsePoint ? doorUsePoint.clone() : new THREE.Vector3(0, 0, 0); }

async function loadAll() {
  const roomEntries = Object.entries(roomInfo);
  for (const [id, info] of roomEntries) {
    const gltf = await loader.loadAsync(`models/${info.file}`);
    normalizeRoom(gltf.scene, id);
  }
  // Recalcular posiciones cuando los tres grupos ya existen, incluyendo la rotación de la sala.
  for (const [key, id] of Object.entries(keyToRoom)) keyPositions[key] = worldPoint(id, roomInfo[id].key);
  const [cow, bunny, bearModel] = await Promise.all([
    loader.loadAsync('models/Vaca_Protagonista.glb'),
    loader.loadAsync('models/Conejo_Complice.glb'),
    loader.loadAsync('models/Oso.glb')
  ]);
  actors.cow = normalizeActor(cow.scene, 1.45);
  actors.bunny = normalizeActor(bunny.scene, 1.48);
  actors.bear = normalizeActor(bearModel.scene, 1.65);
  player.add(actors.cow); buddy.add(actors.bunny); bear.add(actors.bear);
  // Put the key props in the corresponding rooms, without altering the supplied room models.
  for (const [k, p] of Object.entries(keyPositions)) { keys3D[k].position.copy(p); keys3D[k].position.y += (k === 'blue' ? 0 : .45); }
  keys3D.blue.scale.setScalar(1.25);
  keys3D.blue.rotation.z = -.18;
  findOriginalExitDoor();
  setRoom('bed');
  $('#loading').classList.add('hidden'); $('#play').disabled = false; $('#play').textContent = 'COMENZAR';
}
loadAll().catch(err => { console.error(err); $('#loading').innerHTML = '<b>No se pudieron cargar los modelos.</b><small>Abre el proyecto con Live Server y revisa la carpeta models.</small>'; });

const pressed = {};
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); pressed[k] = true;
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if (k === 'escape' && started && !e.repeat) pauseGame(!paused);
  if ((e.code === 'KeyE' || k === 'e') && !e.repeat) { e.preventDefault(); interact(); }
  if (k === '1' && !e.repeat) switchRoom('bed');
  if (k === '2' && !e.repeat) switchRoom('kitchen');
  if (k === '3' && !e.repeat) switchRoom('living');
});
addEventListener('keyup', e => { pressed[e.key.toLowerCase()] = false; });
document.querySelectorAll('.floor-btn').forEach(b => b.addEventListener('click', () => switchRoom(b.dataset.room)));
$('#play').addEventListener('click', resetGame);
$('#show-instructions').addEventListener('click', () => { $('#start').classList.add('hidden'); $('#instructions').classList.remove('hidden'); });
$('#instructions-back').addEventListener('click', () => { $('#instructions').classList.add('hidden'); $('#start').classList.remove('hidden'); });
$('#resume').addEventListener('click', () => pauseGame(false));
$('#restart').addEventListener('click', resetGame);
$('#retry').addEventListener('click', () => { caught = false; setRoom(active); $('#caught').classList.add('hidden'); started = true; });
$('#again').addEventListener('click', resetGame);

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  if (finale && actors.cow) {
    const t = Math.min((clock.elapsedTime - finaleStartedAt) / 2.25, 1);
    if (doorUsePoint && finaleCowStart && finaleBunnyStart) {
      const outward = new THREE.Vector3(doorUsePoint.x - roomGroups.living.position.x, 0, doorUsePoint.z - roomGroups.living.position.z).normalize();
      const cowEnd = doorUsePoint.clone().addScaledVector(outward, 2.0);
      const bunnyEnd = doorUsePoint.clone().addScaledVector(outward, 2.7);
      player.position.lerpVectors(finaleCowStart, cowEnd, t);
      buddy.position.lerpVectors(finaleBunnyStart, bunnyEnd, t);
      actors.cow.rotation.y = Math.atan2(outward.x, outward.z);
      actors.bunny.rotation.y = Math.atan2(outward.x, outward.z);
    }
    if (exitDoor && exitDoor.userData.opening) {
      const startRot = exitDoor.userData.startRotation || 0;
      exitDoor.rotation.y = startRot + t * Math.PI * .48;
    }
    if (t >= 1 && !$('#ending').dataset.shown) {
      $('#ending').dataset.shown = '1';
      $('#ending').classList.remove('hidden');
      $('#ending').querySelector('p').textContent = '¡La vaca y el conejo salieron de la casa abandonada! La llave azul abrió la puerta y ambos lograron escapar.';
      started = false;
      showToast('¡La vaca y el conejo lograron salir de la casa abandonada!');
    }
  }
  if (started && !paused && !finale && actors.cow) {
    elapsed += dt;
    let dx = 0, dz = 0;
    if (pressed.arrowleft || pressed.a) dx -= 1;
    if (pressed.arrowright || pressed.d) dx += 1;
    if (pressed.arrowup || pressed.w) dz -= 1;
    if (pressed.arrowdown || pressed.s) dz += 1;
    const len = Math.hypot(dx,dz) || 1, speed = 4.15;
    dx = dx / len * speed * dt; dz = dz / len * speed * dt;
    const nx = player.position.x + dx, nz = player.position.z + dz;
    if (!blocked(active, nx, player.position.z)) player.position.x = nx;
    if (!blocked(active, player.position.x, nz)) player.position.z = nz;
    if (dx || dz) actors.cow.rotation.y = Math.atan2(dx,dz);
    const follow = new THREE.Vector3(player.position.x - .85, 0, player.position.z + .8);
    const bx = THREE.MathUtils.damp(buddy.position.x, follow.x, 3, dt);
    const bz = THREE.MathUtils.damp(buddy.position.z, follow.z, 3, dt);
    if (!blocked(active, bx, bz)) { buddy.position.x = bx; buddy.position.z = bz; }
    if (elapsed > 24) {
      $('#threat').style.display = 'block';
      const atExit = active === 'living' && Object.values(collected).every(Boolean) && doorUsePoint && distance(player.position, doorUsePoint) < 6.0;
      const direction = new THREE.Vector3(player.position.x - bear.position.x, 0, player.position.z - bear.position.z);
      const d = direction.length();
      if (d > .02 && !atExit) {
        direction.normalize(); const step = direction.multiplyScalar(0.68 * dt);
        const tx = bear.position.x + step.x, tz = bear.position.z + step.z;
        if (!blocked(active, tx, tz)) { bear.position.x = tx; bear.position.z = tz; }
        actors.bear.rotation.y = Math.atan2(step.x, step.z);
      }
      if (d < 0.95 && !atExit) { caught = true; started = false; $('#caught').classList.remove('hidden'); }
    }
    for (const [key, obj] of Object.entries(keys3D)) {
      if (!obj.visible) continue;
      obj.rotation.y += dt * 1.5;
      if (key === 'blue') obj.position.y = keyPositions.blue.y + Math.sin(clock.elapsedTime * 2.2) * .13;
    }
    updateObjective();
  }
  renderer.render(scene, camera);
}
animate();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
