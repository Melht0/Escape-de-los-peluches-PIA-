import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const host=document.querySelector('#stage');
const scene=new THREE.Scene(); scene.background=new THREE.Color('#21191a');
const camera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,.1,180);
camera.position.set(0,31,39); camera.lookAt(0,1,0);
const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25; host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffe4c2,0x342323,2.0));
const keyLight=new THREE.DirectionalLight(0xffd19a,3.1); keyLight.position.set(-12,28,18); keyLight.castShadow=true; keyLight.shadow.mapSize.set(2048,2048); scene.add(keyLight);
const fill=new THREE.PointLight(0xff9b46,100,60); fill.position.set(0,13,0); scene.add(fill);
const loader=new GLTFLoader(); const clock=new THREE.Clock();
const mat=(color,rough=.82,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const mats={wood:mat('#53311f'),wood2:mat('#805033'),wall:mat('#d5a75e'),wall2:mat('#2a160d'),tile:mat('#a88b73'),dark:mat('#171311'),gold:mat('#e8a83d',.3,.6),white:mat('#e9dfd3'),brown:mat('#50372b'),blue:mat('#253044'),green:mat('#273a30'),fabric:mat('#b8a18d')};
const world=new THREE.Group(); scene.add(world);
function box(parent,name,x,y,z,w,h,d,material,opts={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.name=name;m.position.set(x,y,z);m.castShadow=opts.cast!==false;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,name,x,y,z,r1,r2,h,material){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,24),material);m.name=name;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
function texturingFloor(parent,x,z,w,d,material,grid=0){box(parent,'floor',x,.02,z,w,.16,d,material);if(grid){for(let xx=x-w/2;xx<=x+w/2+.01;xx+=grid)box(parent,'floor-seam',xx,.105,z,.025,.012,d,mat('#765c49'));for(let zz=z-d/2;zz<=z+d/2+.01;zz+=grid)box(parent,'floor-seam',x,.105,zz,w,.012,.025,mat('#765c49'));}}
function roomShell(parent,id,cx,cz,w,d,wallMat,floorMat,frontHeight=2.4){const g=new THREE.Group();g.position.set(cx,0,cz);g.userData={id,cx,cz,w,d};parent.add(g);texturingFloor(g,0,0,w,d,floorMat,id==='kitchen'?1.5:0);
// side/back walls and low front wall keep all furniture visible in the isometric overview
box(g,'back-wall',0,2.9,-d/2,w,5.8,.32,wallMat);box(g,'left-wall',-w/2,2.3,0,.32,4.6,d,wallMat);box(g,'right-wall',w/2,2.3,0,.32,4.6,d,wallMat);box(g,'front-wall-left',-w*.34,frontHeight/2,d/2,w*.32,frontHeight,.32,wallMat);box(g,'front-wall-right',w*.34,frontHeight/2,d/2,w*.32,frontHeight,.32,wallMat);
// bronze structural frame
const trim=mat('#a95e25',.38,.55);box(g,'top-back-trim',0,5.85,-d/2,w+.3,.22,.5,trim);box(g,'left-trim',-w/2,2.35,0,.45,4.8,d+.4,trim);box(g,'right-trim',w/2,2.35,0,.45,4.8,d+.4,trim);box(g,'front-trim',0,frontHeight+.15,d/2,w+.45,.35,.55,trim);
// top warm light accents
for(let i=-1;i<=1;i++)box(g,'warm-light',i*w*.27,5.98,-d/2,.9,.12,.18,mats.gold);
return g;}
const bedRoom=roomShell(world,'bed',-8,-7,14,10,mat('#c18a3e'),mat('#4a2e21'),2.1);
const kitchen=roomShell(world,'kitchen',8,-7,14,10,mat('#d7c5a8'),mat('#806b59'),2.1);
const living=roomShell(world,'living',0,7,19,11,mat('#302017'),mat('#57504d'),2.2);
// bedroom: same main pieces and arrangement as supplied Blender scene
box(bedRoom,'bed-base',-3,.72,1.1,5.6,1.05,3.3,mats.wood2);box(bedRoom,'mattress',-3,1.35,1.1,5.5,.38,3.25,mats.white);box(bedRoom,'pillow',-4.8,1.62,1.1,1.3,.25,1.05,mat('#f5e8dc'));box(bedRoom,'headboard',-3,1.8,-.65,5.8,1.9,.25,mats.brown);box(bedRoom,'bedside',.8,.75,-1.4,1.2,1.4,1.2,mats.brown);cylinder(bedRoom,'lamp-base',.8,1.55,-1.4,.25,.25,.12,mats.gold);cylinder(bedRoom,'lamp-shade',.8,2.05,-1.4,.42,.2,.8,mat('#f4d5a1'));box(bedRoom,'dresser',5,.9,-2.8,1.6,1.8,1.2,mats.brown);box(bedRoom,'shelf',-4,2.3,-4.65,2.1,2.7,.3,mat('#382b25'));for(let y=1.5;y<3.5;y+=.55)box(bedRoom,'shelf-board',-4,y,-4.42,1.9,.09,.4,mat('#655044'));
// kitchen: tiled walls, counter, table, two chairs, fridge
box(kitchen,'counter-back',0,1.15,-3.85,8.6,1.8,.8,mats.wood2);box(kitchen,'counter-top',0,2.1,-3.8,8.9,.18,1.05,mat('#b58a5e'));for(let x=-3;x<=3;x+=1.5){box(kitchen,'cabinet-door',x,1.05,-3.35,1.35,1.3,.12,mat('#c9b69e'));cylinder(kitchen,'cabinet-knob',x+.4,1.1,-3.25,.06,.06,.08,mats.gold)}box(kitchen,'fridge',5,1.7,-2.1,1.8,3.2,1.7,mat('#aeb9ba',.35,.18));box(kitchen,'fridge-handle',4.3,1.8,-1.2,.08,1.2,.08,mat('#667174',.3,.5));box(kitchen,'table-top',0,1.45,.7,4.7,.25,2.1,mats.wood2);for(const x of [-1.9,1.9])for(const z of [-.05,1.45])box(kitchen,'table-leg',x,.7,z,.18,1.35,.18,mats.brown);for(const x of [-3.2,3.2]){box(kitchen,'chair-seat',x,1,.8,1.5,.25,1.4,mats.fabric);box(kitchen,'chair-back',x,1.8,1.45,1.5,1.5,.2,mat('#9da5a5'));for(const dx of [-.55,.55])for(const dz of [.3,1.3])box(kitchen,'chair-leg',x+dx,.48,dz,.12,1,.12,mat('#a4afb0'));}cylinder(kitchen,'plate',-.7,1.61,.65,.42,.42,.05,mats.white);cylinder(kitchen,'plate',.8,1.61,.65,.42,.42,.05,mats.white);
// living room: wallpaper, cabinet, television, door, green chair and side table
box(living,'wardrobe',-6,1.55,-4.2,3,3.1,1.6,mats.brown);box(living,'wardrobe-blue-door',-6,1.7,-3.35,1.25,2.1,.1,mats.blue);box(living,'wardrobe-blue-door',-4.7,1.7,-3.35,1.25,2.1,.1,mats.blue);box(living,'tv-body',-4.3,1.1,1.2,3.1,2.2,1.1,mat('#171c1c'));box(living,'tv-screen',-4.3,1.1,.62,2.7,1.75,.08,mat('#0d2226',.18,.25));for(const x of [-5,-3.6]){const ant=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.6,8),mat('#a8b0a7'));ant.position.set(x,2.65,.95);ant.rotation.z=.35;living.add(ant)}
// Exit door: placed on the front-left wall of the living room, matching the requested position.
// Replace that wall segment with two short wall pieces so the doorway is genuinely open.
const oldFront= living.children.find(o=>o.name==='front-wall-left');
if(oldFront) living.remove(oldFront);
box(living,'front-wall-left-a',-8.45,1.1,5.5,2.1,2.2,.32,mat('#302017'));
box(living,'front-wall-left-b',-3.05,1.1,5.5,2.1,2.2,.32,mat('#302017'));
const exitDoorPivot=new THREE.Group(); exitDoorPivot.position.set(-6.85,0,5.34); living.add(exitDoorPivot);
box(exitDoorPivot,'exit-door',1.15,1.85,0,2.3,3.7,.2,mat('#634632'));
box(exitDoorPivot,'exit-door-panel',1.15,1.85,.13,1.55,2.75,.08,mat('#77563d'));
box(exitDoorPivot,'exit-door-handle',2.05,1.8,.24,.09,.28,.08,mats.gold);
box(living,'exit-door-frame-left',-7.1,2,5.48,.22,4,.35,mat('#80604a'));
box(living,'exit-door-frame-right',-4.3,2,5.48,.22,4,.35,mat('#80604a'));
box(living,'exit-door-frame-top',-5.7,3.95,5.48,3,.22,.35,mat('#80604a'));
box(living,'exit-threshold',-5.7,.14,5.48,2.8,.16,.55,mats.gold);
// distinctive green angular chair silhouette
box(living,'chair-seat',3,1.2,.7,2.5,.45,2,mats.green);box(living,'chair-back',3,2.3,-.1,2.4,2.2,.45,mats.green).rotation.x=-.16;box(living,'chair-arm',1.85,1.7,.8,.4,1.4,2,mats.green);box(living,'chair-arm',4.15,1.7,.8,.4,1.4,2,mats.green);cylinder(living,'side-table-pedestal',6.2,.8,1.6,.12,.12,1.5,mats.brown);cylinder(living,'side-table-top',6.2,1.6,1.6,.9,.9,.16,mat('#c7b6a4'));cylinder(living,'cup',6.2,1.82,1.6,.22,.28,.34,mats.white);
// door openings are indicated with bright thresholds
for(const room of [bedRoom,kitchen,living]){box(room,'threshold',0,.14,room.userData.d/2-.05,2.1,.16,.55,mats.gold)}

// subtle background floor and brass perimeter
box(scene,'underlay',0,-.65,0,60,.5,42,mat('#171211'));
const rail=mat('#56311e',.42,.6);for(const [x,z,w,d] of [[-8,-7,14,10],[8,-7,14,10],[0,7,19,11]]){box(world,'outer-foundation',x,-.18,z,w+.8,.35,d+.8,rail)}

const actors={cow:null,bunny:null,bear:null};
async function loadActor(file,height){const gltf=await loader.loadAsync(`models/${file}`);const obj=gltf.scene;obj.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;if(n.material){n.material.side=THREE.DoubleSide;}}});const b=new THREE.Box3().setFromObject(obj);const size=b.getSize(new THREE.Vector3());const scale=height/Math.max(size.y,.01);obj.scale.setScalar(scale);obj.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(obj);obj.position.y-=bb.min.y;return obj;}
const spawn={bed:new THREE.Vector3(-10,0,-7),kitchen:new THREE.Vector3(5,0,-7),living:new THREE.Vector3(-3,0,7)};
let active='bed',playing=false,paused=false,cutscene=false,keys={gold:false,blue:false,green:false},doorAttempt=0,lastSafe='bed',elapsed=0,toastTimer=0,nearText='';
const player=new THREE.Group();scene.add(player);const buddy=new THREE.Group();scene.add(buddy);const bear=new THREE.Group();scene.add(bear);
const roomMap={bed:bedRoom,kitchen,living};const roomMeta={bed:{name:'PISO 3 · HABITACIÓN',objective:'Busca la llave dorada debajo de la cama'},kitchen:{name:'PISO 2 · COCINA',objective:'El conejo moverá la silla para alcanzar la llave azul'},living:{name:'PISO 1 · SALA',objective:'Busca la llave verde dentro de la taza'}};
function roomBounds(id){const r=roomMap[id].userData;return {minX:r.cx-r.w/2+1,maxX:r.cx+r.w/2-1,minZ:r.cz-r.d/2+1,maxZ:r.cz+r.d/2-(id==='living'?-1:1)}}
function moveActor(obj,pos){obj.position.copy(pos)}
function setRoom(id){active=id;const p=spawn[id].clone();player.position.set(p.x,0,p.z);buddy.position.set(p.x-1.6,0,p.z+.8);if(actors.bear){const r=roomBounds(id);bear.position.set(r.maxX-1,0,r.minZ+1);}document.querySelector('#room-name').textContent=roomMeta[id].name;document.querySelector('#objective').textContent=roomMeta[id].objective;document.querySelectorAll('.floor-btn').forEach(b=>b.classList.toggle('active',b.dataset.room===id));lastSafe=id;}
function showToast(t){const el=document.querySelector('#toast');el.textContent=t;el.style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.opacity=0,2200)}
function updateKeys(){for(const k of ['gold','blue','green']){const el=document.querySelector(`[data-key="${k}"] small`);el.textContent=keys[k]?'CONSEGUIDA':'PENDIENTE';el.style.color=keys[k]?'#f6c56c':''}}
function pause(show){paused=show;document.querySelector('#pause').classList.toggle('hidden',!show)}
function showScreen(id){document.querySelectorAll('.overlay').forEach(e=>e.classList.add('hidden'));if(id)document.querySelector('#'+id).classList.remove('hidden')}
function reset(){keys={gold:false,blue:false,green:false};doorAttempt=0;updateKeys();elapsed=0;cutscene=false;setRoom('bed');bear.position.set(-3.4,0,-11);playing=true;paused=false;showScreen(null);showToast('Encuentra las tres llaves y evita al oso.');}
function changeRoom(id){if(id==='kitchen'&&!keys.gold){showToast('Primero necesitas la llave dorada para abrir el acceso a la cocina.');return}if(id==='living'&&!keys.blue){showToast('La puerta de la sala sigue cerrada. Busca la llave azul.');return}setRoom(id);showToast(`Entraste a ${id==='bed'?'la habitación':id==='kitchen'?'la cocina':'la sala'}.`)}
function getDistance(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
function interact(){if(!playing||paused||cutscene)return;const p=player.position;
 if(active==='bed'&&!keys.gold&&getDistance(p,new THREE.Vector3(-3,0,1.1))<4.1){keys.gold=true;updateKeys();showToast('¡Encontraste la llave dorada debajo de la cama!');return}
 if(active==='kitchen'&&!keys.blue&&getDistance(p,new THREE.Vector3(5,0,-2.1))<4.2){keys.blue=true;updateKeys();showToast('El conejo movió la silla. ¡Conseguiste la llave azul del refrigerador!');buddy.position.set(4,0,-.2);return}
 if(active==='living'&&!keys.green&&getDistance(p,new THREE.Vector3(6.2,0,1.6))<3.4){keys.green=true;updateKeys();showToast('¡La llave verde estaba dentro de la taza!');return}
 if(active==='living'&&getDistance(p,new THREE.Vector3(-5.7,0,10.8))<2.9){
   if(!(keys.gold&&keys.blue&&keys.green)){showToast('Necesitas reunir las tres llaves antes de probar la cerradura.');return}
   const attempts=[['gold','La llave dorada no entra en la cerradura.'],['green','La llave verde tampoco funciona.'],['blue','¡La llave azul gira! La puerta se está abriendo.']];
   const [which,message]=attempts[Math.min(doorAttempt,2)];showToast(message);doorAttempt++;
   if(which==='blue'){startEnding();}return;
 }
 if(active==='bed'&&keys.gold){changeRoom('kitchen');return}if(active==='kitchen'&&keys.blue){changeRoom('living');return}showToast('Acércate al objeto y presiona E para interactuar.');}
function startEnding(){cutscene=true;showToast('¡La llave azul gira! La puerta se abre.');setTimeout(()=>{exitDoorPivot.rotation.y=-Math.PI/1.8;},450);setTimeout(()=>{showScreen('ending');playing=false;},3000)}
function setActionHint(){let t=roomMeta[active].objective;if(active==='bed'&&keys.gold)t='Llave dorada conseguida. Ve a la cocina.';if(active==='kitchen'&&keys.blue)t='Llave azul conseguida. Continúa hacia la sala.';if(active==='living'&&keys.gold&&keys.blue&&keys.green)t='Prueba las llaves en la puerta central.';document.querySelector('#objective').textContent=t}
let cowReady=false;
Promise.all([loadActor('Vaca_Protagonista.glb',2.05),loadActor('Conejo_Complice.glb',1.65),loadActor('Oso.glb',2.35)]).then(([c,b,o])=>{actors.cow=c;actors.bunny=b;actors.bear=o;player.add(c);buddy.add(b);bear.add(o);setRoom('bed');cowReady=true;document.querySelector('#play').disabled=false;document.querySelector('#play').textContent='COMENZAR';}).catch(err=>{console.error(err);document.querySelector('#loading')?.remove();showToast('No se pudieron cargar los modelos GLB. Revisa la carpeta models.');});
// movement, soft obstacle blocking around furniture and room walls
const obstacles={bed:[[-3,1.1,2.7,1.7],[5,-2.8,1.2,1.2],[-4,-4.5,2.2,.5]],kitchen:[[0,-3.7,8.7,1.1],[5,-2.1,1.8,1.8],[0,.7,4.8,2.2],[-3.2,.8,1.5,1.5],[3.2,.8,1.5,1.5]],living:[[-6,-4.2,3,1.7],[0,-4.6,2.8,.6],[-4.3,1.2,3.1,1.1],[3,.7,2.5,2.2],[6.2,1.6,1.8,1.8]]};
function blocked(id,x,z){const r=roomBounds(id);if(x<r.minX||x>r.maxX||z<r.minZ||z>r.maxZ)return true;for(const [ox,oz,w,d] of obstacles[id])if(Math.abs(x-ox)<w/2+.45&&Math.abs(z-oz)<d/2+.45)return true;return false;}
const down={};addEventListener('keydown',e=>{const k=e.key.toLowerCase();down[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'&&playing)pause(!paused);if(k==='e')interact();if(k==='1')changeRoom('bed');if(k==='2')changeRoom('kitchen');if(k==='3')changeRoom('living');});addEventListener('keyup',e=>down[e.key.toLowerCase()]=false);
document.querySelectorAll('.floor-btn').forEach(b=>b.addEventListener('click',()=>changeRoom(b.dataset.room)));
document.querySelector('#play').addEventListener('click',()=>{if(!cowReady){showToast('Espera a que terminen de cargar los personajes.');return}reset()});document.querySelector('#show-instructions').onclick=()=>showScreen('instructions');document.querySelector('#instructions-back').onclick=()=>showScreen('start');document.querySelector('#resume').onclick=()=>pause(false);document.querySelector('#restart').onclick=()=>{setRoom(active);pause(false)};document.querySelector('#retry').onclick=()=>{setRoom(lastSafe);showScreen(null);playing=true};document.querySelector('#again').onclick=()=>{reset()};

function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(playing&&!paused&&!cutscene&&cowReady){elapsed+=dt;const speed=5.1;let dx=0,dz=0;if(down.arrowleft||down.a)dx-=1;if(down.arrowright||down.d)dx+=1;if(down.arrowup||down.w)dz-=1;if(down.arrowdown||down.s)dz+=1;const len=Math.hypot(dx,dz)||1;dx=dx/len*speed*dt;dz=dz/len*speed*dt;const nx=player.position.x+dx,nz=player.position.z+dz;if(!blocked(active,nx,player.position.z))player.position.x=nx;if(!blocked(active,player.position.x,nz))player.position.z=nz;if(dx||dz){const yaw=Math.atan2(dx,dz);actors.cow.rotation.y=yaw;}
 const follow=new THREE.Vector3(player.position.x-1.1,0,player.position.z+1.15);buddy.position.lerp(follow,Math.min(1,dt*3));if(Math.abs(dx)+Math.abs(dz)>.001)actors.bunny.rotation.y=Math.atan2(dx,dz);
 // Bear begins searching after a short delay and chases the active room.
 if(elapsed>8){document.querySelector('#threat').style.display='block';const target=player.position.clone();const dir=target.sub(bear.position);const dist=dir.length();if(dist>.01){dir.normalize();const step=dir.multiplyScalar(1.55*dt);const bx=bear.position.x+step.x,bz=bear.position.z+step.z;if(!blocked(active,bx,bz)){bear.position.x=bx;bear.position.z=bz;}actors.bear.rotation.y=Math.atan2(step.x,step.z);}if(dist<1.35){playing=false;showScreen('caught')}}
 setActionHint();}
 renderer.render(scene,camera);}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
