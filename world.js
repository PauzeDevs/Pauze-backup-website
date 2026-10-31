const bootWorld = () => import("https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js").then((THREE) => {
  const canvas = document.querySelector("#pauze-world");
  if (!canvas || !window.WebGLRenderingContext) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const lowMemory = (navigator.deviceMemory || 8) < 4;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: !coarse, alpha: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    canvas.dataset.state = "fallback";
    return;
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse || lowMemory ? 1 : 1.35));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080d13, 0.025);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 190);
  camera.position.set(0, 1.1, 12);

  scene.add(new THREE.HemisphereLight(0xa9d5e8, 0x070a10, 1.15));
  const key = new THREE.PointLight(0x9ddcf4, 32, 34, 2);
  key.position.set(2.5, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x477d9c, 42, 40, 2);
  rim.position.set(-5, -1, -5);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);
  const metal = new THREE.MeshStandardMaterial({ color: 0x263746, metalness: .88, roughness: .24 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xa9ddf5, metalness: .72, roughness: .2, emissive: 0x1d526b, emissiveIntensity: .55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101a24, metalness: .8, roughness: .38 });
  const wire = new THREE.MeshBasicMaterial({ color: 0x78b9d4, transparent: true, opacity: .32, wireframe: true });

  const hero = new THREE.Group();
  world.add(hero);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.28, .055, 12, 120), edge);
  ringA.rotation.set(.9, .25, .35);
  hero.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.02, .026, 8, 100), metal);
  ringB.rotation.set(.25, 1.1, .1);
  hero.add(ringB);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.72, 2), metal);
  hero.add(core);
  hero.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.79, 1), wire));
  const diagonal = new THREE.Mesh(new THREE.BoxGeometry(2.2, .095, .13), edge);
  diagonal.rotation.z = -.68;
  diagonal.position.set(.1, .04, .12);
  hero.add(diagonal);
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.7, .14), metal);
  vertical.position.set(-.62, -.03, .1);
  hero.add(vertical);
  const satellites = new THREE.Group();
  hero.add(satellites);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 12), edge);
    bead.position.set(Math.cos(a) * 1.7, Math.sin(a) * 1.7, Math.sin(a * 2) * .18);
    satellites.add(bead);
  }

  const grid = new THREE.GridHelper(100, 80, 0x315268, 0x1b2c39);
  grid.position.y = -3.25;
  grid.material.transparent = true;
  grid.material.opacity = .2;
  world.add(grid);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ color: 0x080d13, transparent: true, opacity: .16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.28;
  world.add(floor);

  const architecture = new THREE.Group();
  world.add(architecture);
  for (let i = 0; i < 22; i++) {
    const side = i % 2 ? 1 : -1;
    const height = 2.2 + (i % 4) * .65;
    const width = .12 + (i % 2) * .08;
    const pillar = new THREE.Group();
    pillar.position.set(side * (4.2 + (i % 3) * .65), -1.1, -i * 3.8 - 3);
    pillar.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, width * 1.8), dark));
    const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(.018, height * .92, .02), edge);
    lightStrip.position.x = width * .52;
    pillar.add(lightStrip);
    architecture.add(pillar);
  }

  const sectionIds = ["work", "about", "arcade", "build-log", "activity", "web-development", "contact"];
  const sectionNames = ["Projects", "About", "Arcade", "Build log", "Live status", "Websites", "Contact"];
  const gateways = [];
  const gatewayMat = new THREE.MeshStandardMaterial({ color: 0x6fabc5, metalness: .72, roughness: .28, emissive: 0x16394a, emissiveIntensity: .45 });
  const gatewayDark = new THREE.MeshStandardMaterial({ color: 0x17232d, metalness: .82, roughness: .32 });
  sectionIds.forEach((id, index) => {
    const group = new THREE.Group();
    const width = coarse ? 3.4 : 4.8;
    const height = coarse ? 3.1 : 4.1;
    const depth = .16;
    const post = new THREE.BoxGeometry(.055, height, depth);
    const beam = new THREE.BoxGeometry(width, .055, depth);
    const left = new THREE.Mesh(post, gatewayDark);
    left.position.x = -width / 2;
    group.add(left);
    const right = new THREE.Mesh(post, gatewayDark);
    right.position.x = width / 2;
    group.add(right);
    const top = new THREE.Mesh(beam, gatewayMat);
    top.position.y = height / 2;
    group.add(top);
    const bottom = new THREE.Mesh(beam, gatewayDark);
    bottom.position.y = -height / 2;
    group.add(bottom);
    const marker = new THREE.Mesh(new THREE.BoxGeometry(.025, height * .62, .025), gatewayMat);
    marker.position.set(index % 2 ? -width * .28 : width * .28, 0, .12);
    group.add(marker);
    world.add(group);
    gateways.push({ id, group, index });
  });

  // Four original project installations, mapped to the real project cards.
  const projectInstallations = [];
  const installMaterials = {
    shell: new THREE.MeshStandardMaterial({ color: 0x1b2b37, metalness: .86, roughness: .24 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x9ddcf4, metalness: .55, roughness: .2, emissive: 0x2b7898, emissiveIntensity: .8 }),
    core: new THREE.MeshStandardMaterial({ color: 0x36566b, metalness: .78, roughness: .28, emissive: 0x102d3b, emissiveIntensity: .35 })
  };
  const addInstallPart = (group, geometry, material, x=0, y=0, z=0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    mesh.userData.projectInstall = true;
    group.add(mesh);
    return mesh;
  };
  const installSpecs = [
    { id:"project-weather", type:"weather", x:-2.05, y:.05 },
    { id:"project-pulse", type:"pulse", x:2.05, y:.05 },
    { id:"project-control", type:"control", x:-2.05, y:.05 },
    { id:"project-experiments", type:"experiments", x:2.05, y:.05 }
  ];
  installSpecs.forEach((spec,index) => {
    const group = new THREE.Group();
    group.userData.targetId = spec.id;
    const halo = addInstallPart(group, new THREE.TorusGeometry(.78,.018,8,72), installMaterials.glow);
    halo.rotation.x = Math.PI * .5;
    if (spec.type === "weather") {
      addInstallPart(group,new THREE.SphereGeometry(.43,28,20),installMaterials.core);
      const radar = addInstallPart(group,new THREE.TorusGeometry(.57,.025,8,64),installMaterials.glow);
      radar.rotation.set(.8,.2,.1);
      addInstallPart(group,new THREE.BoxGeometry(.9,.025,.025),installMaterials.glow,0,.48,0);
      addInstallPart(group,new THREE.SphereGeometry(.075,16,12),installMaterials.glow,.55,.12,.12);
    } else if (spec.type === "pulse") {
      addInstallPart(group,new THREE.IcosahedronGeometry(.48,1),installMaterials.core);
      for(let i=0;i<3;i++){
        const orbit=addInstallPart(group,new THREE.TorusGeometry(.62+i*.12,.014,6,64),i===1?installMaterials.shell:installMaterials.glow);
        orbit.rotation.set(.5+i*.55,.25+i*.4,.2);
      }
      addInstallPart(group,new THREE.BoxGeometry(.09,.9,.09),installMaterials.glow,.0,0,.0).rotation.z=.65;
    } else if (spec.type === "control") {
      addInstallPart(group,new THREE.BoxGeometry(.72,.72,.72),installMaterials.shell);
      addInstallPart(group,new THREE.BoxGeometry(.78,.12,.12),installMaterials.glow,0,.0,.42);
      addInstallPart(group,new THREE.BoxGeometry(.12,.78,.12),installMaterials.glow,.0,.0,.42);
      for(let i=0;i<4;i++) addInstallPart(group,new THREE.SphereGeometry(.075,12,10),installMaterials.glow,Math.cos(i*Math.PI/2)*.62,Math.sin(i*Math.PI/2)*.62,.12);
    } else {
      for(let i=0;i<5;i++){
        const node=addInstallPart(group,new THREE.IcosahedronGeometry(.16+(i%2)*.06,1),i%2?installMaterials.shell:installMaterials.glow,(i-2)*.32,Math.sin(i*1.7)*.3,Math.cos(i*1.3)*.22);
        node.rotation.set(i*.3,i*.6,0);
      }
      addInstallPart(group,new THREE.TorusGeometry(.48,.018,8,56),installMaterials.glow).rotation.set(.8,.2,.5);
    }
    world.add(group);
    projectInstallations.push({ ...spec, group, halo });
  });

  const particleCount = coarse ? 120 : 260;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - .5) * 34;
    positions[i * 3 + 1] = (Math.random() - .5) * 18;
    positions[i * 3 + 2] = -Math.random() * 86 + 12;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x9bcde1, size: .025, transparent: true, opacity: .58 }));
  world.add(particles);

  // Small route control: real section anchors, no duplicate page content.
  const hud = document.createElement("nav");
  hud.className = "world-route-hud";
  hud.setAttribute("aria-label", "Explore PAUZE sections");
  hud.innerHTML = '<span class="world-route-label">WORLD / 01</span><div class="world-route-links"></div><span class="world-route-progress" aria-hidden="true"><i></i></span>';
  const routeLinks = hud.querySelector(".world-route-links");
  sectionIds.forEach((id, index) => {
    const link = document.createElement("a");
    link.href = "#" + id;
    link.textContent = String(index + 1).padStart(2, "0");
    link.setAttribute("aria-label", "Go to " + sectionNames[index]);
    link.title = sectionNames[index];
    routeLinks.append(link);
  });
  document.body.append(hud);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0;
  let targetScroll = 0;
  let raf = 0;
  let running = false;
  let activeSection = -1;
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const maxTravel = () => Math.min(68, Math.max(31, (maxScroll() / Math.max(1, innerHeight)) * 5.4));
  const placeProjectInstallations = () => {
    const range = maxTravel();
    projectInstallations.forEach(({id,group,x,y}) => {
      const card = document.getElementById(id);
      if (!card) { group.visible = false; return; }
      const progress = Math.min(1,Math.max(0,card.offsetTop / maxScroll()));
      group.visible = true;
      group.position.set(coarse ? x*.62 : x,y,12-progress*range-4.6);
      group.scale.setScalar(coarse ? .78 : 1);
    });
  };

  const placeGateways = () => {
    const range = maxTravel();
    gateways.forEach(({ id, group, index }) => {
      const section = document.getElementById(id);
      if (!section) {
        group.visible = false;
        return;
      }
      const progress = Math.min(1, Math.max(0, section.offsetTop / maxScroll()));
      group.visible = true;
      group.position.set((index % 2 ? 1 : -1) * (coarse ? 3 : 4.4), -.25, 12 - progress * range - 5.5);
    });
  };

  const updateRoute = () => {
    const midpoint = scrollY + innerHeight * .42;
    let next = 0;
    sectionIds.forEach((id, index) => {
      const section = document.getElementById(id);
      if (section && section.offsetTop <= midpoint) next = index;
    });
    if (next === activeSection) return;
    activeSection = next;
    hud.querySelector(".world-route-label").textContent = "WORLD / " + String(next + 1).padStart(2, "0");
    routeLinks.querySelectorAll("a").forEach((link, index) => {
      if (index === next) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const onScroll = () => {
    targetScroll = scrollY / maxScroll();
    hud.querySelector(".world-route-progress i").style.setProperty("--route-progress", targetScroll);
    updateRoute();
    placeGateways();
    placeProjectInstallations();
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("pointermove", event => {
    if (coarse) return;
    pointer.tx = (event.clientX / innerWidth - .5) * 2;
    pointer.ty = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });

  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse || lowMemory ? 1.2 : 1.65));
    renderer.setSize(innerWidth, innerHeight, false);
    placeGateways();
    onScroll();
    if (reduced) draw(0);
  };
  addEventListener("resize", resize, { passive: true });
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => { placeGateways(); placeProjectInstallations(); });
    observer.observe(document.querySelector("main"));
  }


  // Raycast the installation meshes without blocking normal page controls.
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const hitInstallation = event => {
    pointerNdc.x = (event.clientX / innerWidth) * 2 - 1;
    pointerNdc.y = -(event.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointerNdc,camera);
    const hits = raycaster.intersectObjects(projectInstallations.map(item=>item.group),true);
    const hit = hits.find(item=>item.object.userData.projectInstall);
    return hit ? projectInstallations.find(item=>item.group===hit.object.parent || item.group===hit.object.parent?.parent || item.group===hit.object.parent?.parent?.parent) : null;
  };
  let lastRaycastAt = 0;
  let lastHoveredInstallation = null;
  addEventListener("pointermove",event=>{
    if (coarse) return;
    const now = performance.now();
    if (now - lastRaycastAt < 80) return;
    lastRaycastAt = now;
    const found=hitInstallation(event);
    if (found === lastHoveredInstallation) return;
    lastHoveredInstallation = found;
    document.body.classList.toggle("world-install-hover",Boolean(found));
    document.querySelectorAll(".project.is-world-active").forEach(card=>card.classList.remove("is-world-active"));
    if(found) document.getElementById(found.id)?.classList.add("is-world-active");
  },{passive:true});
  addEventListener("pointerdown",event=>{
    if(event.target.closest("a,button,input,textarea,select,summary,.project")) return;
    const found=hitInstallation(event);
    if(!found) return;
    document.getElementById(found.id)?.scrollIntoView({behavior:reduced?"auto":"smooth",block:"center"});
  });

  const clock = new THREE.Clock();
  function draw(elapsed) {
    pointer.x += (pointer.tx - pointer.x) * .035;
    pointer.y += (pointer.ty - pointer.y) * .035;
    scroll = reduced ? targetScroll : scroll + (targetScroll - scroll) * .045;
    const travel = scroll * maxTravel();
    camera.position.x = pointer.x * (coarse ? .16 : .5);
    camera.position.y = 1.05 + pointer.y * -.24 + (reduced ? 0 : Math.sin(elapsed * .18) * .1);
    camera.position.z = 12 - travel;
    camera.rotation.x = pointer.y * .018;
    camera.rotation.y = -pointer.x * .025;
    camera.rotation.z = reduced ? 0 : Math.sin(elapsed * .11) * .005;
    hero.position.set(pointer.x * .18, .25 + (reduced ? 0 : Math.sin(elapsed * .5) * .12), 1.3);
    hero.rotation.y = elapsed * (reduced ? 0 : .16) + pointer.x * .13;
    hero.rotation.x = (reduced ? 0 : Math.sin(elapsed * .3) * .08) + pointer.y * .08;
    ringA.rotation.z = elapsed * (reduced ? 0 : .12);
    ringB.rotation.x = .25 + (reduced ? 0 : Math.sin(elapsed * .24) * .18);
    satellites.rotation.z = -elapsed * (reduced ? 0 : .22);
    core.rotation.y = elapsed * (reduced ? 0 : .12);
    particles.position.z = (travel * .22) % 18;
    key.position.x = 2.5 + pointer.x * 2;
    architecture.position.z = -travel * .12;
    gateways.forEach(({ group, index }) => {
      group.rotation.y = reduced ? 0 : Math.sin(elapsed * .22 + index) * .025;
    });
    projectInstallations.forEach(({group,halo,type},index) => {
      if (!reduced) {
        group.rotation.y = Math.sin(elapsed*.38+index)*.16;
        group.rotation.x = Math.sin(elapsed*.24+index)*.08;
        halo.rotation.z = elapsed*(type==="weather"?.18:.12)*(index%2?-1:1);
      }
    });
    renderer.render(scene, camera);
  }

  function frame() {
    if (!running || document.hidden) return;
    draw(clock.getElapsedTime());
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (reduced || running || document.hidden) return;
    running = true;
    clock.start();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  placeGateways();
  placeProjectInstallations();
  onScroll();
  if (reduced) draw(0);
  else start();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) start();
      else stop();
    }, { threshold: 0 });
    visibilityObserver.observe(canvas);
  }
  canvas.dataset.state = "ready";
}).catch(() => {
  const canvas = document.querySelector("#pauze-world");
  if (canvas) canvas.dataset.state = "fallback";
});

// Let the browser paint the page before loading the decorative 3D scene.
if ("requestIdleCallback" in window) requestIdleCallback(bootWorld, { timeout: 1800 });
else setTimeout(bootWorld, 350);