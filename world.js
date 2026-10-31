import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

(() => {
  const canvas = document.querySelector("#pauze-world");
  if (!canvas || !("WebGLRenderingContext" in window)) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const lowMemory = (navigator.deviceMemory || 8) < 4;
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: !coarse, alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse || lowMemory ? 1.25 : 1.8));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080d13, 0.026);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 180);
  camera.position.set(0, 1.2, 12);

  scene.add(new THREE.HemisphereLight(0x9fcde0, 0x070a10, 1.25));
  const key = new THREE.PointLight(0x9ddcf4, 34, 32, 2);
  key.position.set(2.5, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x477d9c, 48, 38, 2);
  rim.position.set(-5, -1, -5); scene.add(rim);

  const world = new THREE.Group(); scene.add(world);
  const metal = new THREE.MeshStandardMaterial({color:0x263746, metalness:.88, roughness:.24});
  const edge = new THREE.MeshStandardMaterial({color:0xa9ddf5, metalness:.72, roughness:.2, emissive:0x1d526b, emissiveIntensity:.55});
  const dark = new THREE.MeshStandardMaterial({color:0x101a24, metalness:.8, roughness:.38});
  const wire = new THREE.MeshBasicMaterial({color:0x78b9d4, transparent:true, opacity:.32, wireframe:true});
  const hero = new THREE.Group(); world.add(hero);

  // An original P/Z-inspired kinetic sculpture, assembled from geometry.
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.28,.055,12,120), edge);
  ringA.rotation.set(.9,.25,.35); hero.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.02,.026,8,100), metal);
  ringB.rotation.set(.25,1.1,.1); hero.add(ringB);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.72,2), metal);
  hero.add(core);
  const coreWire = new THREE.Mesh(new THREE.IcosahedronGeometry(.79,1), wire);
  hero.add(coreWire);
  const diagonal = new THREE.Mesh(new THREE.BoxGeometry(2.2,.095,.13), edge);
  diagonal.rotation.z=-.68; diagonal.position.set(.1,.04,.12); hero.add(diagonal);
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(.12,1.7,.14), metal);
  vertical.position.set(-.62,-.03,.1); hero.add(vertical);
  const satelliteGroup = new THREE.Group(); hero.add(satelliteGroup);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    const bead=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),edge);
    bead.position.set(Math.cos(a)*1.7,Math.sin(a)*1.7,Math.sin(a*2)*.18);
    satelliteGroup.add(bead);
  }

  // A quiet architectural grid and distant procedural landmarks.
  const grid = new THREE.GridHelper(100,80,0x315268,0x1b2c39);
  grid.position.y=-3.25; grid.material.transparent=true; grid.material.opacity=.22; world.add(grid);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({color:0x080d13,transparent:true,opacity:.18}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-3.28; world.add(floor);

  const architecture = new THREE.Group(); world.add(architecture);
  const landmarks = [];
  const makeMonolith=(x,y,z,h,w=0.16)=>{
    const g=new THREE.Group(); g.position.set(x,y,z);
    const slab=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*1.8),dark); g.add(slab);
    const line=new THREE.Mesh(new THREE.BoxGeometry(.018,h*.92,.02),edge); line.position.x=w*.52; g.add(line);
    architecture.add(g); landmarks.push(g);
  };
  for(let i=0;i<18;i++){
    const side=i%2?1:-1, z=-i*3.8-3;
    makeMonolith(side*(4.2+(i%3)*.65),-1.1,z,2.2+(i%4)*.65,.12+(i%2)*.08);
  }

  // Section gateways are positioned from the real page layout. The 3D route
  // therefore follows the actual content instead of an arbitrary scroll distance.
  const sectionIds = ["work","about","arcade","activity","web-development","contact"];
  const gateways = [];
  const gatewayMat = new THREE.MeshStandardMaterial({color:0x6fabc5,metalness:.72,roughness:.28,emissive:0x16394a,emissiveIntensity:.45});
  const gatewayDark = new THREE.MeshStandardMaterial({color:0x17232d,metalness:.82,roughness:.32});
  sectionIds.forEach((id,index)=>{
    const group = new THREE.Group();
    const width = coarse ? 3.4 : 4.8;
    const height = coarse ? 3.1 : 4.1;
    const depth = .16;
    const postGeo = new THREE.BoxGeometry(.055,height,depth);
    const beamGeo = new THREE.BoxGeometry(width,.055,depth);
    const left = new THREE.Mesh(postGeo,gatewayDark); left.position.x=-width/2; group.add(left);
    const right = new THREE.Mesh(postGeo,gatewayDark); right.position.x=width/2; group.add(right);
    const top = new THREE.Mesh(beamGeo,gatewayMat); top.position.y=height/2; group.add(top);
    const bottom = new THREE.Mesh(beamGeo,gatewayDark); bottom.position.y=-height/2; group.add(bottom);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(.13,.018,8,32),gatewayMat);
    inner.position.set(index%2 ? width*.34 : -width*.34, -height*.25, .12); group.add(inner);
    const marker = new THREE.Mesh(new THREE.BoxGeometry(.025,height*.62,.025),gatewayMat);
    marker.position.set(index%2 ? -width*.28 : width*.28,0,.12); group.add(marker);
    world.add(group);
    gateways.push({id,group,index});
  });

  // Fine particles are generated locally, not fetched imagery.
  const count=coarse?420:900, positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    positions[i*3]=(Math.random()-.5)*34;
    positions[i*3+1]=(Math.random()-.5)*18;
    positions[i*3+2]=-Math.random()*76+12;
  }
  const particleGeometry=new THREE.BufferGeometry();
  particleGeometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const particles=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0x9bcde1,size:.025,transparent:true,opacity:.62}));
  world.add(particles);

  const pointer={x:0,y:0,tx:0,ty:0};
  let scroll=0, targetScroll=0, last=0;
  const maxScroll=()=>Math.max(1,document.documentElement.scrollHeight-innerHeight);\n  const maxTravel=()=>Math.min(68,Math.max(31,(maxScroll()/Math.max(1,innerHeight))*5.4));\n  const placeGateways=()=>{\n    const range=maxTravel();\n    gateways.forEach(({id,group,index})=>{\n      const section=document.getElementById(id);\n      if(!section) { group.visible=false; return; }\n      const progress=Math.min(1,Math.max(0,section.offsetTop/maxScroll()));\n      group.visible=true;\n      group.position.set((index%2 ? 1 : -1)*(coarse?3.0:4.4),-.25,12-progress*range-5.5);\n      group.rotation.z=(index%2 ? 1 : -1)*.025;\n    });\n  };
  const onScroll=()=>{targetScroll=scrollY/maxScroll();placeGateways();};
  addEventListener("scroll",onScroll,{passive:true}); onScroll();
  addEventListener("pointermove",e=>{
    pointer.tx=(e.clientX/innerWidth-.5)*2;
    pointer.ty=(e.clientY/innerHeight-.5)*2;
  },{passive:true});
  addEventListener("resize",()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse||lowMemory?1.25:1.8));
    renderer.setSize(innerWidth,innerHeight,false);
  });

  const clock=new THREE.Clock();
  function render(){
    const elapsed=clock.getElapsedTime();
    pointer.x+=(pointer.tx-pointer.x)*.035;
    pointer.y+=(pointer.ty-pointer.y)*.035;
    scroll+=(targetScroll-scroll)*.045;

    // The camera travels through one continuous corridor as the real page scrolls.
    const travel=scroll*maxTravel();
    camera.position.x=pointer.x*(coarse?.22:.58);
    camera.position.y=1.05+pointer.y*-.28+Math.sin(elapsed*.18)*.12;
    camera.position.z=12-travel;
    camera.rotation.x=pointer.y*.018;
    camera.rotation.y=-pointer.x*.025;
    camera.rotation.z=Math.sin(elapsed*.11)*.006;
    hero.position.set(pointer.x*.18, .25+Math.sin(elapsed*.5)*.12, 1.3);
    hero.rotation.y=elapsed*(reduced?0:.16)+pointer.x*.13;
    hero.rotation.x=Math.sin(elapsed*.3)*.08+pointer.y*.08;
    ringA.rotation.z=elapsed*(reduced?0:.12);
    ringB.rotation.x=.25+Math.sin(elapsed*.24)*.18;
    satelliteGroup.rotation.z=-elapsed*(reduced?0:.22);
    core.rotation.y=elapsed*(reduced?0:.12);
    particles.position.z=(travel*.22)%18;
    key.position.x=2.5+pointer.x*2;
    architecture.position.z=-travel*.12;\n    gateways.forEach(({group,index})=>{ group.rotation.y=Math.sin(elapsed*.22+index)*.025; });

    renderer.render(scene,camera);
    if (!reduced) requestAnimationFrame(render);
  }
  if (reduced) renderer.render(scene,camera);
  else requestAnimationFrame(render);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !reduced) requestAnimationFrame(render);
  });
})();