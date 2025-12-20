import * as THREE from "three";

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

// Layout & Positioning
// Mobile (< 550px)
const WEBGL_TITLE_MARGIN_TOP_MOBILE = "35dvh";
const WEBGL_SUBTITLE_TOP_MOBILE = "calc(35dvh + 5rem)";
// Desktop (>= 550px)
const WEBGL_TITLE_MARGIN_TOP_DESKTOP = "60dvh";
const WEBGL_SUBTITLE_TOP_DESKTOP = "calc(60dvh + 8rem)";
const WEBGL_TITLE_DEPTH = "-0.25";
const WEBGL_SUBTITLE_DEPTH = "-0.2";

// Camera Settings
const CAMERA_FOV = 50;
const CAMERA_ASPECT = 1;
const CAMERA_NEAR = 0.01;
const CAMERA_FAR = 10;
const CAMERA_Z = 0.5;

// Portrait Settings
const PORTRAIT_SIZE = 0.4;
const PORTRAIT_SEGMENTS = 451;
const PORTRAIT_SCALE_Z = 0.1;
const PORTRAIT_EMISSIVE_COLOR = 0x0044aa;
const PORTRAIT_EMISSIVE_INTENSITY = 0.2;
const PORTRAIT_ROUGHNESS = 0.7;
const PORTRAIT_METALNESS = 0.3;

// Lighting
const LIGHT_COLOR = 0xffffff;
const LIGHT_INTENSITY = 1;
const LIGHT_DISTANCE = 100;
const LIGHT_POSITION = { x: 0, y: 0, z: 1 };

// Hand Positions
const LEFT_HAND_POS = { x: -0.12, y: -0.05, z: 0.15 };
const RIGHT_HAND_POS = { x: 0.14, y: -0.05, z: 0.15 };

// Navigation Data
const NAV_DATA = [
  { label: "About", url: "#about", color: 0x0055dd },
  { label: "Contact", url: "/memo/notes/my/contact/", color: 0x0055dd },
  { label: "Notes", url: "/memo/", color: 0x0055dd },
  { label: "Feed", url: "/memo/log/", color: 0x0055dd },
];

// Orb Settings
const ORB_RADIUS = 0.015;
const ORB_SEGMENTS = 32;
const ORB_EMISSIVE_INTENSITY = 1.2;
const ORB_EMISSIVE_INTENSITY_HOVERED = 2.0;
const ORB_ROUGHNESS = 0.3;
const ORB_METALNESS = 0.0;
const ORB_OPACITY = 0.8;
const ORB_TRANSMISSION = 0.0;
const ORB_SHIMMER_SPEED = 0.002;
const ORB_SHIMMER_AMOUNT = 0.3;
const ORB_GLOW_OPACITY = 0.4;
const ORB_GLOW_SCALE = 1.3;
const ORB_POINT_LIGHT_INTENSITY = 0.3;
const ORB_POINT_LIGHT_DISTANCE = 0.1;
const ORB_NOISE_SCALE = 50.0;
const ORB_NOISE_SPEED = 0.000005;
const ORB_NOISE_OPACITY_MIN = 0.0;
const ORB_NOISE_OPACITY_MAX = 0.85;
const ORB_NOISE_THRESHOLD = 0.45;
const ORB_BASE_POSITIONS = [
  { x: -0.09, y: -0.02, z: 0.18 }, // About (left side - furthest back)
  { x: -0.03, y: 0.0, z: 0.22 }, // Contact (left-center)
  { x: 0.03, y: 0.0, z: 0.22 }, // Notes (right-center)
  { x: 0.09, y: -0.02, z: 0.18 }, // Feed (right side - furthest back)
];

// Orb Animation
const ORB_FLOAT_SPEED = 0.001;
const ORB_FLOAT_AMPLITUDE = 0.008;
const ORB_MOUSE_INFLUENCE_DISTANCE = 3;
const ORB_MOUSE_INFLUENCE_STRENGTH = 0.015;
const ORB_POSITION_LERP_SPEED = 0.1;
const ORB_SCALE_HOVERED = 1.3;
const ORB_SCALE_NORMAL = 1.0;
const ORB_SCALE_LERP_SPEED = 0.1;

// Text Sprite Settings
const TEXT_SPRITE_CANVAS_WIDTH = 256;
const TEXT_SPRITE_CANVAS_HEIGHT = 64;
const TEXT_SPRITE_FONT = "Bold 32px Arial";
const TEXT_SPRITE_COLOR = "#0066ff";
const TEXT_SPRITE_GLOW_BLUR = 10;
const TEXT_SPRITE_SCALE_X = 0.08;
const TEXT_SPRITE_SCALE_Y = 0.02;
const TEXT_SPRITE_OFFSET_Y = -0.03;
const TEXT_SPRITE_OPACITY_VISIBLE = 1.0;
const TEXT_SPRITE_OPACITY_HIDDEN = 0.3;
const TEXT_SPRITE_DISTANCE_THRESHOLD = 0.7;

// Dust Particles
const PARTICLE_COUNT_PER_ORB = 50;
const PARTICLE_SIZE = 0.002;
const PARTICLE_COLOR = 0x3366ff;
const PARTICLE_OPACITY = 0.12;
const PARTICLE_SPAWN_RADIUS = 0.025; // Spherical radius around each orb
const PARTICLE_DRIFT_SPEED = 0.00008;
const PARTICLE_LIFETIME_INCREMENT = 0.004;
const PARTICLE_FADE_SPEED = 5;

// Lightning Arcs
const ARC_COUNT = 6;
const ARC_POINTS = 10;
const ARC_COLOR = 0x0055dd;
const ARC_OPACITY = 0.6;
const ARC_LINE_WIDTH = 6;
const ARC_ACTIVATION_PROBABILITY = 0.01;
const ARC_NOISE_AMPLITUDE = 0.02;
const ARC_LIFETIME_MAX = 20;
const ARC_HAND_SPREAD_RADIUS = 0.03;
const ARC_ORB_SPREAD_RADIUS = 0.015;

// Renderer Settings
const RENDERER_SIZE = 2500;
const RENDERER_PIXEL_RATIO = 1;

// Portrait Rotation
const ROTATION_ORIENTATION_MULTIPLIER = 0.05;
const ROTATION_MOUSE_MULTIPLIER = 0.1;

/**
 * Initialize the hero scene with 3D portrait, electrical effects, and interactive orbs
 */
export function initHeroScene() {
  // Check if webgl supported and enabled, and if not, append static image
  if (!window.hardwareAccelAvail) {
    const img = document.createElement("img");
    img.src = "/memo/assets/images/me-technomancer.png";
    document.getElementById("my-head").appendChild(img);
    return;
  }

  // Get the --links CSS variable value for text color
  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--links")
    .trim();

  // Hide HTML links when WebGL is available
  const heroLinks = document.querySelector(".hero-links");
  if (heroLinks) heroLinks.style.display = "none";

  // Move title and subtitle much lower when WebGL is enabled
  const heroSection = document.querySelector("#scene");
  const titleElement = heroSection?.querySelector(".title");
  const subtitleElement = heroSection?.querySelector(".subtitle");

  // Function to update positioning based on window width
  const updatePositioning = () => {
    const isDesktop = window.innerWidth >= 550;

    if (titleElement) {
      titleElement.style.marginTop = isDesktop ? WEBGL_TITLE_MARGIN_TOP_DESKTOP : WEBGL_TITLE_MARGIN_TOP_MOBILE;
      // Set data-depth on the parent div, not the h1 itself
      const titleParent = titleElement.closest("[data-depth]");
      if (titleParent) {
        titleParent.setAttribute("data-depth", WEBGL_TITLE_DEPTH);
      }
    }

    if (subtitleElement) {
      subtitleElement.style.marginTop = isDesktop ? WEBGL_SUBTITLE_TOP_DESKTOP : WEBGL_SUBTITLE_TOP_MOBILE;
      subtitleElement.style.position = "";
      subtitleElement.style.top = "";
      // Set data-depth on the parent div, not the h2 itself
      const subtitleParent = subtitleElement.closest("[data-depth]");
      if (subtitleParent) {
        subtitleParent.setAttribute("data-depth", WEBGL_SUBTITLE_DEPTH);
      }
    }
  };

  // Apply initial positioning
  updatePositioning();

  // Update positioning on window resize
  window.addEventListener('resize', updatePositioning);

  // Reinitialize parallax after changing data-depth attributes
  if (window.parallax && window.Parallax) {
    setTimeout(() => {
      window.parallax.destroy();
      window.parallax = new window.Parallax(document.getElementById("scene"));
      if (!window.hardwareAccelAvail) {
        window.parallax.disable();
      }
    }, 0);
  }

  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    CAMERA_ASPECT,
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  camera.position.z = CAMERA_Z;

  const scene = new THREE.Scene();

  // Portrait mesh with emissive properties
  const geometry = new THREE.PlaneGeometry(
    PORTRAIT_SIZE,
    PORTRAIT_SIZE,
    PORTRAIT_SEGMENTS,
    PORTRAIT_SEGMENTS,
  );
  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    map: new THREE.TextureLoader().load(
      "/memo/assets/images/me-technomancer.png",
    ),
    displacementMap: new THREE.TextureLoader().load(
      "/memo/assets/images/me-technomancer-depth.png",
    ),
    emissive: PORTRAIT_EMISSIVE_COLOR,
    emissiveIntensity: PORTRAIT_EMISSIVE_INTENSITY,
    roughness: PORTRAIT_ROUGHNESS,
    metalness: PORTRAIT_METALNESS,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(1, 1, PORTRAIT_SCALE_Z);
  scene.add(mesh);

  const light = new THREE.PointLight(
    LIGHT_COLOR,
    LIGHT_INTENSITY,
    LIGHT_DISTANCE,
  );
  light.position.set(LIGHT_POSITION.x, LIGHT_POSITION.y, LIGHT_POSITION.z);
  scene.add(light);

  // Hand positions (based on portrait - adjust as needed)
  const leftHandPos = new THREE.Vector3(
    LEFT_HAND_POS.x,
    LEFT_HAND_POS.y,
    LEFT_HAND_POS.z,
  );
  const rightHandPos = new THREE.Vector3(
    RIGHT_HAND_POS.x,
    RIGHT_HAND_POS.y,
    RIGHT_HAND_POS.z,
  );

  // Navigation data
  const navData = NAV_DATA;

  // Create 4 navigation orbs with static base positions
  const orbs = [];
  const orbLabels = [];

  // Create a group for orbs so they rotate together with the portrait
  const orbsGroup = new THREE.Group();
  scene.add(orbsGroup);

  // Helper function to create text sprite
  const createTextSprite = (text, color) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = TEXT_SPRITE_CANVAS_WIDTH;
    canvas.height = TEXT_SPRITE_CANVAS_HEIGHT;

    // Add black glow effect first
    context.font = TEXT_SPRITE_FONT;
    context.shadowColor = "#000000";
    context.shadowBlur = TEXT_SPRITE_GLOW_BLUR * 2;
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      text,
      TEXT_SPRITE_CANVAS_WIDTH / 2,
      TEXT_SPRITE_CANVAS_HEIGHT / 2,
    );

    // Draw text again for sharper center
    context.shadowBlur = 0;
    context.fillText(
      text,
      TEXT_SPRITE_CANVAS_WIDTH / 2,
      TEXT_SPRITE_CANVAS_HEIGHT / 2,
    );

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false, // Always render on top, don't interfere with orb depth
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(TEXT_SPRITE_SCALE_X, TEXT_SPRITE_SCALE_Y, 1);
    sprite.renderOrder = 2000; // Render text labels last
    return sprite;
  };

  navData.forEach((data, i) => {
    const orbGeo = new THREE.SphereGeometry(
      ORB_RADIUS,
      ORB_SEGMENTS,
      ORB_SEGMENTS,
    );
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: ORB_EMISSIVE_INTENSITY,
      roughness: ORB_ROUGHNESS,
      metalness: ORB_METALNESS,
      transparent: true,
      opacity: ORB_OPACITY,
      transmission: ORB_TRANSMISSION,
      thickness: 0.5,
      ior: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      depthWrite: true, // Enable depth writing so orbs properly occlude
      depthTest: true,
      side: THREE.DoubleSide, // Render both sides for 3D depth effect
    });

    // Add procedural noise and fresnel shader effects
    orbMat.onBeforeCompile = (shader) => {
      // Add time uniform and unique seed for this orb
      shader.uniforms.time = { value: 0 };
      shader.uniforms.seed = { value: (i + 1) * 123.456 }; // Unique non-zero seed per orb
      orb.userData.shader = shader;

      // Add varying declaration to vertex shader header
      shader.vertexShader = "varying vec3 vWorldPos;\n" + shader.vertexShader;

      // Pass position to fragment shader for noise (using original vertex position)
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        vWorldPos = position;
        `,
      );

      // Add noise functions at the top of fragment shader
      shader.fragmentShader =
        `
        uniform float time;
        uniform float seed;
        varying vec3 vWorldPos;

        // Simple 3D noise function
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 p = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);

          return mix(
            mix(mix(hash(p + vec3(0, 0, 0)), hash(p + vec3(1, 0, 0)), f.x),
                mix(hash(p + vec3(0, 1, 0)), hash(p + vec3(1, 1, 0)), f.x), f.y),
            mix(mix(hash(p + vec3(0, 0, 1)), hash(p + vec3(1, 0, 1)), f.x),
                mix(hash(p + vec3(0, 1, 1)), hash(p + vec3(1, 1, 1)), f.x), f.y),
            f.z);
        }

        // Layered noise (fbm)
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for(int i = 0; i < 4; i++) {
            value += amplitude * noise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
      ` + shader.fragmentShader;

      // Apply noise to opacity and fresnel glow
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `
        #include <emissivemap_fragment>

        // Apply animated procedural noise with unique direction per orb
        // Create pseudo-random direction vector from seed
        float seedX = fract(sin(seed * 12.9898) * 43758.5453);
        float seedY = fract(sin(seed * 78.233) * 43758.5453);
        float seedZ = fract(sin(seed * 45.164) * 43758.5453);

        // Convert to direction on sphere
        vec3 direction = normalize(vec3(
          seedX * 2.0 - 1.0,
          seedY * 2.0 - 1.0,
          seedZ * 2.0 - 1.0
        ));

        // Flip direction for back faces so animation appears reversed
        if (!gl_FrontFacing) {
          direction = -direction;
        }

        // Move noise in unique direction for each orb
        vec3 animatedPos = vWorldPos + direction * time;
        float noiseValue = fbm(animatedPos * ${ORB_NOISE_SCALE.toFixed(1)} + seed * 100.0);

        // Create sharper transitions with threshold and power function
        float alphaMod = smoothstep(${ORB_NOISE_THRESHOLD.toFixed(2)} - 0.08, ${ORB_NOISE_THRESHOLD.toFixed(2)} + 0.08, noiseValue);
        alphaMod = pow(alphaMod, 4.0); // Very sharp contrast

        // Clamp to ensure we never have fully opaque orb
        alphaMod = mix(${ORB_NOISE_OPACITY_MIN.toFixed(2)}, ${ORB_NOISE_OPACITY_MAX.toFixed(2)}, alphaMod);

        // Fresnel effect for magical edge glow
        vec3 viewDirection = normalize(vViewPosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, normal)), 3.5);
        totalEmissiveRadiance *= (1.0 + fresnel * 3.0);

        // Modulate alpha with noise - create dramatic transparent patches
        diffuseColor.a *= alphaMod;
        `,
      );
    };

    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.renderOrder = 200; // Render orbs after arcs

    // Add point light inside orb for realistic 3D lighting
    const pointLight = new THREE.PointLight(
      data.color,
      ORB_POINT_LIGHT_INTENSITY,
      ORB_POINT_LIGHT_DISTANCE,
    );
    pointLight.position.set(0, 0, 0);
    orb.add(pointLight);
    orb.userData.pointLight = pointLight;

    // Add outer glow sphere for extra magical effect
    const glowGeo = new THREE.SphereGeometry(
      ORB_RADIUS * ORB_GLOW_SCALE,
      ORB_SEGMENTS,
      ORB_SEGMENTS,
    );
    const glowMat = new THREE.MeshBasicMaterial({
      color: data.color,
      transparent: true,
      opacity: ORB_GLOW_OPACITY,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.renderOrder = 200; // Same as orb
    orb.add(glowMesh);
    orb.userData = {
      ...data,
      index: i,
      basePos: ORB_BASE_POSITIONS[i],
      floatPhase: (i / navData.length) * Math.PI * 2,
      rotationAxis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      ).normalize(),
      rotationSpeed: 0.003 + Math.random() * 0.002,
      axisChangeSpeed: 0.0001 + Math.random() * 0.0001,
    };

    // Set initial position
    orb.position.copy(ORB_BASE_POSITIONS[i]);

    orbsGroup.add(orb);
    orbs.push(orb);

    // Create 3D text sprite label for orb
    const labelSprite = createTextSprite(data.label, textColor);
    labelSprite.userData.orb = orb;
    orbsGroup.add(labelSprite);
    orbLabels.push(labelSprite);
  });

  // Create dust particle systems - one for each orb
  const orbParticleSystems = [];

  orbs.forEach((orb) => {
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT_PER_ORB * 3);
    const sizes = new Float32Array(PARTICLE_COUNT_PER_ORB);
    const lifetimes = [];

    for (let i = 0; i < PARTICLE_COUNT_PER_ORB; i++) {
      // Start particles randomly in a sphere around the orb's initial position
      const phi = Math.random() * Math.PI * 2; // Azimuthal angle
      const theta = Math.acos(2 * Math.random() - 1); // Polar angle (uniform distribution)
      const radius = Math.cbrt(Math.random()) * PARTICLE_SPAWN_RADIUS; // Cube root for uniform volume distribution

      // Position relative to orb's position in orbsGroup
      positions[i * 3] =
        orb.position.x + radius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] =
        orb.position.y + radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = orb.position.z + radius * Math.cos(theta);

      sizes[i] = 0;
      lifetimes.push(Math.random());
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: PARTICLE_SIZE,
      color: PARTICLE_COLOR,
      transparent: true,
      opacity: PARTICLE_OPACITY,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const dustParticles = new THREE.Points(particles, particleMaterial);
    orbsGroup.add(dustParticles); // Add to orbsGroup so it rotates but doesn't bob with orb

    orbParticleSystems.push({ particles: dustParticles, lifetimes, orb });
  });

  // Lightning arc lines
  const arcLines = [];
  const createLightningArc = () => {
    const points = [];
    for (let i = 0; i < ARC_POINTS; i++) {
      points.push(new THREE.Vector3(0, 0, 0));
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
    const arcMat = new THREE.LineBasicMaterial({
      color: ARC_COLOR,
      transparent: true,
      opacity: ARC_OPACITY,
      blending: THREE.AdditiveBlending,
      linewidth: ARC_LINE_WIDTH,
      depthWrite: false,
      depthTest: true, // Test depth but don't write, so arcs go behind orbs
    });
    const line = new THREE.Line(arcGeo, arcMat);
    line.userData = { active: false, lifetime: 0 };
    line.renderOrder = 100; // Render arcs after portrait but before orbs
    scene.add(line);
    return line;
  };

  for (let i = 0; i < ARC_COUNT; i++) {
    arcLines.push(createLightningArc());
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(RENDERER_SIZE, RENDERER_SIZE);
  renderer.setPixelRatio(RENDERER_PIXEL_RATIO);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cursor = "default";

  // Mouse tracking
  const mouse = new THREE.Vector2();
  const mouse3D = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  let hoveredOrb = null;

  renderer.domElement.addEventListener("mousemove", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Calculate 3D mouse position for orb interaction
    mouse3D.set(mouse.x, mouse.y, 0.5);
    mouse3D.unproject(camera);
    const dir = mouse3D.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    mouse3D.copy(camera.position).add(dir.multiplyScalar(distance));
  });

  renderer.domElement.addEventListener("click", async (event) => {
    if (DeviceOrientationEvent?.requestPermission) {
      const permissionState =
        await window.DeviceOrientationEvent.requestPermission();
      if (permissionState === "granted") {
        window.parallax.destroy();
        window.parallax = new Parallax(document.getElementById("scene"));
        return;
      }
    }

    // Check for orb or label clicks
    raycaster.setFromCamera(mouse, camera);

    // Check both orbs and labels together
    const allInteractables = [...orbs, ...orbLabels];
    const intersects = raycaster.intersectObjects(allInteractables, false);

    let clickedOrb = null;
    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      // Check if we hit a sprite (label) or an orb
      if (hitObject.isSprite && hitObject.userData.orb) {
        clickedOrb = hitObject.userData.orb;
      } else {
        // Hit an orb directly
        clickedOrb = hitObject;
      }
    }

    if (clickedOrb) {
      const url = clickedOrb.userData.url;
      if (url) {
        // Handle anchor links in same window, others in new tab
        if (url.startsWith("#")) {
          window.location.href = url;
        } else {
          window.open(url, "_blank");
        }
      }
    }
  });

  // Update dust particles for each orb
  const updateDustParticles = (time) => {
    orbParticleSystems.forEach((system) => {
      const positions = system.particles.geometry.attributes.position.array;
      const sizes = system.particles.geometry.attributes.size.array;

      for (let i = 0; i < PARTICLE_COUNT_PER_ORB; i++) {
        system.lifetimes[i] += PARTICLE_LIFETIME_INCREMENT;

        if (system.lifetimes[i] > 1.0) {
          // Respawn particle randomly in a sphere around the orb's current position
          const phi = Math.random() * Math.PI * 2; // Azimuthal angle
          const theta = Math.acos(2 * Math.random() - 1); // Polar angle (uniform distribution)
          const radius = Math.cbrt(Math.random()) * PARTICLE_SPAWN_RADIUS; // Cube root for uniform volume distribution

          // Position at orb's current position (orb is also in orbsGroup)
          positions[i * 3] =
            system.orb.position.x + radius * Math.sin(theta) * Math.cos(phi);
          positions[i * 3 + 1] =
            system.orb.position.y + radius * Math.sin(theta) * Math.sin(phi);
          positions[i * 3 + 2] =
            system.orb.position.z + radius * Math.cos(theta);
          system.lifetimes[i] = 0;
        } else {
          // Very subtle drift in all directions
          positions[i * 3] += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED;
          positions[i * 3 + 1] += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED;
          positions[i * 3 + 2] += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED;
        }

        // Fade in and out based on lifetime (using size)
        const fadeIn = Math.min(1, system.lifetimes[i] * PARTICLE_FADE_SPEED);
        const fadeOut = Math.min(
          1,
          (1 - system.lifetimes[i]) * PARTICLE_FADE_SPEED,
        );
        sizes[i] = Math.min(fadeIn, fadeOut) * PARTICLE_SIZE;
      }

      system.particles.geometry.attributes.position.needsUpdate = true;
      system.particles.geometry.attributes.size.needsUpdate = true;
    });
  };

  // Update lightning arcs
  const updateLightningArcs = (hands, orbs, time) => {
    arcLines.forEach((arc, idx) => {
      if (Math.random() < ARC_ACTIVATION_PROBABILITY) {
        arc.userData.active = !arc.userData.active;
        arc.userData.lifetime = 0;

        // When activating, randomize both the starting position within hand area
        // and the ending position within orb area
        if (arc.userData.active) {
          const hand = hands[idx % 2];
          const orb = orbs[Math.floor(idx / 2) % orbs.length];

          // Randomize start position in hand
          const startAngle = Math.random() * Math.PI * 2;
          const startRadius = Math.random() * ARC_HAND_SPREAD_RADIUS;
          arc.userData.startPos = {
            x: hand.x + Math.cos(startAngle) * startRadius,
            y: hand.y + Math.sin(startAngle) * startRadius,
            z: hand.z,
          };

          // Store the target orb index and offset (relative to orb center)
          // so we can recalculate position each frame as orbs rotate
          arc.userData.targetOrbIndex = Math.floor(idx / 2) % orbs.length;

          // Randomize end position in a circular area around orb center (like hand spread)
          const endAngle = Math.random() * Math.PI * 2;
          const endRadius = Math.random() * ARC_ORB_SPREAD_RADIUS;
          arc.userData.endOffset = {
            x: Math.cos(endAngle) * endRadius,
            y: Math.sin(endAngle) * endRadius,
            z: 0,
          };
        }
      }

      if (arc.userData.active) {
        const startPos = arc.userData.startPos;
        // Calculate current end position based on orb's current world position + offset
        const targetOrb = orbs[arc.userData.targetOrbIndex];
        const orbWorldPos = new THREE.Vector3();
        targetOrb.getWorldPosition(orbWorldPos);

        // Apply the offset in world space by transforming it through the orb's rotation
        const offsetVector = new THREE.Vector3(
          arc.userData.endOffset.x,
          arc.userData.endOffset.y,
          arc.userData.endOffset.z,
        );
        offsetVector.applyQuaternion(
          targetOrb.getWorldQuaternion(new THREE.Quaternion()),
        );

        const endPos = {
          x: orbWorldPos.x + offsetVector.x,
          y: orbWorldPos.y + offsetVector.y,
          z: orbWorldPos.z + offsetVector.z,
        };
        const positions = arc.geometry.attributes.position.array;

        for (let i = 0; i < ARC_POINTS; i++) {
          const t = i / (ARC_POINTS - 1);
          const x =
            startPos.x +
            (endPos.x - startPos.x) * t +
            (Math.random() - 0.5) * ARC_NOISE_AMPLITUDE * Math.sin(t * Math.PI);
          const y =
            startPos.y +
            (endPos.y - startPos.y) * t +
            (Math.random() - 0.5) * ARC_NOISE_AMPLITUDE * Math.sin(t * Math.PI);
          const z = startPos.z + (endPos.z - startPos.z) * t;

          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
        }

        arc.geometry.attributes.position.needsUpdate = true;
        arc.material.opacity =
          ARC_OPACITY * (1 - arc.userData.lifetime / ARC_LIFETIME_MAX);
        arc.userData.lifetime++;

        if (arc.userData.lifetime > ARC_LIFETIME_MAX) {
          arc.userData.active = false;
        }
      } else {
        arc.material.opacity = 0;
      }
    });
  };

  let startRotationX = null;
  let startRotationY = null;

  function animation(time) {
    // Portrait and orbs rotation
    if (window.parallax.orientationSupport) {
      if (startRotationX === null) startRotationX = window.parallax.inputX;
      if (startRotationY === null) startRotationY = window.parallax.inputY;
      const rotX =
        -(window.parallax.inputX - startRotationX) *
        ROTATION_ORIENTATION_MULTIPLIER;
      const rotY =
        -(window.parallax.inputY - startRotationY) *
        ROTATION_ORIENTATION_MULTIPLIER;
      mesh.rotation.x = rotX;
      mesh.rotation.y = rotY;
      orbsGroup.rotation.x = rotX;
      orbsGroup.rotation.y = rotY;
    } else {
      const rotX = window.parallax.inputY * ROTATION_MOUSE_MULTIPLIER;
      const rotY = window.parallax.inputX * ROTATION_MOUSE_MULTIPLIER;
      mesh.rotation.x = rotX;
      mesh.rotation.y = rotY;
      orbsGroup.rotation.x = rotX;
      orbsGroup.rotation.y = rotY;
    }

    // Animate orbs with subtle floating and mouse interaction
    orbs.forEach((orb, i) => {
      const basePos = orb.userData.basePos;

      // Subtle floating animation (very small vertical movement)
      const floatOffset =
        Math.sin(time * ORB_FLOAT_SPEED + orb.userData.floatPhase) *
        ORB_FLOAT_AMPLITUDE;

      // Mouse interaction - subtle attraction/repulsion (use world position)
      const worldPos = new THREE.Vector3();
      orb.getWorldPosition(worldPos);
      const distToMouse = worldPos.distanceTo(mouse3D);
      const mouseInfluence = Math.max(
        0,
        1 - distToMouse * ORB_MOUSE_INFLUENCE_DISTANCE,
      );
      const mouseDir = new THREE.Vector3()
        .subVectors(mouse3D, new THREE.Vector3(basePos.x, basePos.y, basePos.z))
        .normalize()
        .multiplyScalar(mouseInfluence * ORB_MOUSE_INFLUENCE_STRENGTH);

      // Target position = base + float + mouse interaction (in local space)
      const targetPos = new THREE.Vector3(
        basePos.x + mouseDir.x,
        basePos.y + floatOffset + mouseDir.y,
        basePos.z + mouseDir.z,
      );

      // Smoothly interpolate to target position
      orb.position.lerp(targetPos, ORB_POSITION_LERP_SPEED);

      // Rotate orb on its randomly changing axis
      orb.rotateOnAxis(orb.userData.rotationAxis, orb.userData.rotationSpeed);

      // Slowly change the rotation axis over time
      const axisChangeAngle = orb.userData.axisChangeSpeed;
      const randomAxis = new THREE.Vector3(
        Math.sin(time * 0.00001 + i),
        Math.cos(time * 0.00001 + i * 1.3),
        Math.sin(time * 0.00001 + i * 0.7),
      ).normalize();
      orb.userData.rotationAxis.lerp(randomAxis, axisChangeAngle);
      orb.userData.rotationAxis.normalize();
    });

    // Check for hovered orb or text label
    raycaster.setFromCamera(mouse, camera);

    // Check both orbs and labels together
    const allInteractables = [...orbs, ...orbLabels];
    const intersects = raycaster.intersectObjects(allInteractables, false);

    hoveredOrb = null;
    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      // Check if we hit a sprite (label) or an orb
      if (hitObject.isSprite && hitObject.userData.orb) {
        hoveredOrb = hitObject.userData.orb;
      } else {
        // Hit an orb directly
        hoveredOrb = hitObject;
      }
    }

    // Update cursor style
    renderer.domElement.style.cursor = hoveredOrb ? "pointer" : "default";

    // Update orb scales based on hover and update labels
    orbs.forEach((orb, i) => {
      const targetScale =
        orb === hoveredOrb ? ORB_SCALE_HOVERED : ORB_SCALE_NORMAL;
      orb.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        ORB_SCALE_LERP_SPEED,
      );

      // Add shimmer animation to emissive intensity
      const shimmer =
        Math.sin(time * ORB_SHIMMER_SPEED + i * Math.PI * 0.5) *
        ORB_SHIMMER_AMOUNT;
      const baseIntensity =
        orb === hoveredOrb
          ? ORB_EMISSIVE_INTENSITY_HOVERED
          : ORB_EMISSIVE_INTENSITY;
      orb.material.emissiveIntensity = baseIntensity + shimmer;

      // Update shader time uniform for noise animation
      if (orb.userData.shader) {
        orb.userData.shader.uniforms.time.value = time * ORB_NOISE_SPEED;
      }

      // Update point light intensity with shimmer for 3D depth
      if (orb.userData.pointLight) {
        orb.userData.pointLight.intensity =
          ORB_POINT_LIGHT_INTENSITY + shimmer * 1.5;
      }

      // Update glow mesh opacity with shimmer (find it among children)
      orb.children.forEach((child) => {
        if (
          child.type === "Mesh" &&
          child.material.blending === THREE.AdditiveBlending
        ) {
          child.material.opacity = ORB_GLOW_OPACITY + shimmer * 0.3;
        }
      });

      // Update 3D text sprite label position (below the orb)
      const labelSprite = orbLabels[i];
      const orbPos = orb.position.clone();
      labelSprite.position.set(
        orbPos.x,
        orbPos.y + TEXT_SPRITE_OFFSET_Y,
        orbPos.z,
      );

      // Show label on hover or when orb is close to camera
      const worldPos = new THREE.Vector3();
      orb.getWorldPosition(worldPos);
      const distance = camera.position.distanceTo(worldPos);
      const shouldShow =
        orb === hoveredOrb || distance < TEXT_SPRITE_DISTANCE_THRESHOLD;
      labelSprite.material.opacity = shouldShow
        ? TEXT_SPRITE_OPACITY_VISIBLE
        : TEXT_SPRITE_OPACITY_HIDDEN;
    });

    // Update dust particles
    updateDustParticles(time);

    // Update lightning arcs
    updateLightningArcs([leftHandPos, rightHandPos], orbs, time);

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animation);
  document.getElementById("my-head").appendChild(renderer.domElement);
}
