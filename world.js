import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

(() => {
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

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse || lowMemory ? 1.2 : 1.65));
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

  const sectionIds = ["work", "about", "arcade", "activity", "web-development", "contact"];
  const sectionNames = ["Work", "About", "Arcade", "Live", "Websites", "Contact"];
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

  const particleCount = coarse ? 260 : 650;
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
    hud.querySelector(".world-route-progress i").style.transform = "scaleX(" + targetScroll + ")";
    updateRoute();
    placeGateways();
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
    const observer = new ResizeObserver(() => placeGateways());
    observer.observe(document.querySelector("main"));
  }

  const clock = new THREE.Clock();
  function draw(elapsed) {
    pointer.x += (pointer.tx - pointer.x) * .035;
    pointer.y += (pointer.ty - pointer.y) * .035;
    scroll += (targetScroll - scroll) * .045;
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
  onScroll();
  if (reduced) draw(0);
  else start();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  canvas.dataset.state = "ready";
})();