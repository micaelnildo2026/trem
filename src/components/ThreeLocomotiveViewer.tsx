import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, Play, Pause, RotateCw, ZoomIn, Layers, Maximize2, Gauge, MoveHorizontal } from 'lucide-react';
import { TransmissionConfig } from '../types/locomotive';

interface Props {
  transmission: TransmissionConfig;
}

export const ThreeLocomotiveViewer: React.FC<Props> = ({ transmission }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Viewer state
  const [viewMode, setViewMode] = useState<'solid' | 'xray' | 'transmission' | 'exploded'>('solid');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [activeCameraView, setActiveCameraView] = useState<'iso' | 'side' | 'top' | 'front' | 'trans'>('iso');

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Animated objects refs
  const wheelsGroupRef = useRef<THREE.Group[]>([]);
  const beltMeshRef = useRef<THREE.Mesh | null>(null);
  const beltTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const motorPinionRef = useRef<THREE.Mesh | null>(null);
  const drivenGearRef = useRef<THREE.Mesh | null>(null);
  const axle1GroupRef = useRef<THREE.Group | null>(null);
  const axle2GroupRef = useRef<THREE.Group | null>(null);
  const shellMeshRef = useRef<THREE.Group | null>(null);
  const internalComponentsRef = useRef<THREE.Group | null>(null);
  const dimensionsGroupRef = useRef<THREE.Group | null>(null);

  // Mouse drag control refs
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 580,
    theta: Math.PI / 4,
    phi: Math.PI / 3.2
  });

  // Setup Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // Deep slate-900

    // Subtle grid on floor
    const gridHelper = new THREE.GridHelper(1000, 40, 0x334155, 0x1e293b);
    gridHelper.position.y = -35;
    scene.add(gridHelper);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 3000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(250, 400, 250);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.6); // Soft blue rim light
    dirLight2.position.set(-250, 200, -250);
    scene.add(dirLight2);

    const floorLight = new THREE.DirectionalLight(0x64748b, 0.4);
    floorLight.position.set(0, -200, 0);
    scene.add(floorLight);

    // 5. Build Railway Tracks
    buildRails(scene);

    // 6. Build Complete Locomotive Model
    buildLocomotiveModel(scene);

    // 7. Mouse Orbit & Zoom Events
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraSphericalRef.current.theta -= deltaX * 0.008;
      cameraSphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraSphericalRef.current.radius = Math.max(
        220,
        Math.min(1100, cameraSphericalRef.current.radius + e.deltaY * 0.5)
      );
      updateCameraPosition();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Touch events for mobile
    let touchStartDist = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;
        cameraSphericalRef.current.theta -= deltaX * 0.008;
        cameraSphericalRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.008)
        );
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateCameraPosition();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = (touchStartDist - dist) * 0.5;
        cameraSphericalRef.current.radius = Math.max(220, Math.min(1100, cameraSphericalRef.current.radius + factor));
        touchStartDist = dist;
        updateCameraPosition();
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    dom.addEventListener('touchstart', handleTouchStart);
    dom.addEventListener('touchmove', handleTouchMove);
    dom.addEventListener('touchend', handleTouchEnd);

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 520;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        const rotationSpeed = (transmission.motorRpm / 60) * Math.PI * 2 * speedMultiplier * delta * 0.35;
        const wheelRotationSpeed = rotationSpeed / (transmission.drivenGearTeeth / transmission.motorPinionTeeth);

        // Spin pinion
        if (motorPinionRef.current) {
          motorPinionRef.current.rotation.x -= rotationSpeed;
        }

        // Spin driven spur gear
        if (drivenGearRef.current) {
          drivenGearRef.current.rotation.x += wheelRotationSpeed;
        }

        // Spin Axle 1 and wheels
        if (axle1GroupRef.current) {
          axle1GroupRef.current.rotation.x += wheelRotationSpeed;
        }

        // Spin Axle 2 and wheels synchronously
        if (axle2GroupRef.current) {
          axle2GroupRef.current.rotation.x += wheelRotationSpeed;
        }

        // Advance GT2 belt texture offset for realistic motion
        if (beltTextureRef.current) {
          beltTextureRef.current.offset.y -= wheelRotationSpeed * 0.22;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('touchstart', handleTouchStart);
      dom.removeEventListener('touchmove', handleTouchMove);
      dom.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
    };
  }, []);

  // Update camera coordinates from spherical
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi) + 40;
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 50, 0);
  };

  // Switch camera views
  const setCameraView = (view: 'iso' | 'side' | 'top' | 'front' | 'trans') => {
    setActiveCameraView(view);
    if (view === 'iso') {
      cameraSphericalRef.current = { radius: 560, theta: Math.PI / 4, phi: Math.PI / 3.2 };
    } else if (view === 'side') {
      cameraSphericalRef.current = { radius: 520, theta: Math.PI / 2, phi: Math.PI / 2.1 };
    } else if (view === 'top') {
      cameraSphericalRef.current = { radius: 560, theta: 0.01, phi: 0.05 };
    } else if (view === 'front') {
      cameraSphericalRef.current = { radius: 480, theta: 0, phi: Math.PI / 2.1 };
    } else if (view === 'trans') {
      cameraSphericalRef.current = { radius: 360, theta: Math.PI / 3, phi: Math.PI / 2.8 };
    }
    updateCameraPosition();
  };

  // React to view mode updates (solid / xray / transmission / exploded)
  useEffect(() => {
    if (!shellMeshRef.current || !internalComponentsRef.current) return;

    const shellChildren: THREE.Mesh[] = [];
    shellMeshRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        shellChildren.push(child as THREE.Mesh);
      }
    });

    if (viewMode === 'solid') {
      shellMeshRef.current.visible = true;
      shellMeshRef.current.position.y = 0;
      internalComponentsRef.current.position.y = 0;
      shellChildren.forEach((mesh) => {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            m.transparent = false;
            m.opacity = 1.0;
            if ('wireframe' in m) {
              (m as THREE.MeshStandardMaterial).wireframe = false;
            }
          });
        } else if (mesh.material) {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
          if ('wireframe' in mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).wireframe = false;
          }
        }
      });
    } else if (viewMode === 'xray') {
      shellMeshRef.current.visible = true;
      shellMeshRef.current.position.y = 0;
      internalComponentsRef.current.position.y = 0;
      shellChildren.forEach((mesh) => {
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.28;
          mesh.material.depthWrite = false;
        }
      });
    } else if (viewMode === 'transmission') {
      shellMeshRef.current.visible = false;
      internalComponentsRef.current.position.y = 0;
    } else if (viewMode === 'exploded') {
      shellMeshRef.current.visible = true;
      shellMeshRef.current.position.y = 130; // Float shell upward
      internalComponentsRef.current.position.y = 0;
      shellChildren.forEach((mesh) => {
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.85;
        }
      });
    }
  }, [viewMode]);

  // Toggle dimensions visibility
  useEffect(() => {
    if (dimensionsGroupRef.current) {
      dimensionsGroupRef.current.visible = showDimensions;
    }
  }, [showDimensions]);

  // Function to build railway tracks
  const buildRails = (scene: THREE.Scene) => {
    const trackGroup = new THREE.Group();
    const railGauge = 150; // 150 mm between rail centers!

    // Steel Rail Material
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25
    });

    // 2 Rails (Vignole / T profile approximation)
    const railLength = 700;
    const railHeight = 16;
    const railWidth = 9;

    const railGeo = new THREE.BoxGeometry(railWidth, railHeight, railLength);

    const railLeft = new THREE.Mesh(railGeo, railMat);
    railLeft.position.set(-railGauge / 2, -railHeight / 2, 0);
    railLeft.receiveShadow = true;
    trackGroup.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, railMat);
    railRight.position.set(railGauge / 2, -railHeight / 2, 0);
    railRight.receiveShadow = true;
    trackGroup.add(railRight);

    // Cross ties / Sleepers (Dormentes de madeira/concreto)
    const sleeperMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.1
    });
    const sleeperGeo = new THREE.BoxGeometry(220, 10, 26);

    for (let z = -railLength / 2 + 30; z <= railLength / 2 - 30; z += 55) {
      const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
      sleeper.position.set(0, -railHeight - 5, z);
      sleeper.receiveShadow = true;
      trackGroup.add(sleeper);

      // Fasteners (fixações dos trilhos nos dormentes)
      const boltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const boltGeo = new THREE.CylinderGeometry(2.5, 2.5, 4, 6);

      const boltL = new THREE.Mesh(boltGeo, boltMat);
      boltL.position.set(-railGauge / 2 + 9, -railHeight + 1, z);
      trackGroup.add(boltL);

      const boltR = new THREE.Mesh(boltGeo, boltMat);
      boltR.position.set(railGauge / 2 - 9, -railHeight + 1, z);
      trackGroup.add(boltR);
    }

    scene.add(trackGroup);
  };

  // Function to build the complete locomotive model
  const buildLocomotiveModel = (scene: THREE.Scene) => {
    const locoMasterGroup = new THREE.Group();
    const internalGroup = new THREE.Group();
    const shellGroup = new THREE.Group();
    const dimensionsGroup = new THREE.Group();

    internalComponentsRef.current = internalGroup;
    shellMeshRef.current = shellGroup;
    dimensionsGroupRef.current = dimensionsGroup;

    // --- MATERIALS ---
    const shellBlueMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Sky blue metallic like Onshape CAD
      metalness: 0.35,
      roughness: 0.3,
      side: THREE.DoubleSide
    });

    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.9
    });

    const chassisCarbonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark carbon PA-CF
      roughness: 0.7,
      metalness: 0.2
    });

    const steelAxleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.3
    });

    const motorMetallicMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.35
    });

    const aluminumPulleyMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.9,
      roughness: 0.2
    });

    const rubberTireMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.95,
      metalness: 0.05
    });

    // --- 1. WHEELSETS & AXLES (Bitola 150mm) ---
    // Axle spacing (wheelbase) = 160 mm
    const wheelbase = 160;
    const axleZ1 = -wheelbase / 2; // Rear axle (Eixo 1 - Motor + Gear + Pulley 1)
    const axleZ2 = wheelbase / 2;  // Front axle (Eixo 2 - Pulley 2)
    const wheelRadius = 32.5;     // 65 mm diameter
    const wheelThickness = 12;
    const railGauge = 150;        // Exactly 150 mm between wheel centers

    const createWheelMesh = () => {
      const wheelGroup = new THREE.Group();
      // Main wheel body
      const rimGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 32);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, steelAxleMat);
      rimMesh.castShadow = true;
      wheelGroup.add(rimMesh);

      // High friction O-Ring insert on tread (for maximum traction in Tug-of-War & 20kg Helpers)
      const oRingGeo = new THREE.TorusGeometry(wheelRadius - 0.5, 2.2, 12, 32);
      oRingGeo.rotateY(Math.PI / 2);
      const oRingMesh = new THREE.Mesh(oRingGeo, rubberTireMat);
      wheelGroup.add(oRingMesh);

      // Railway Wheel Flange (Friso interno que impede descarrilamento)
      const flangeGeo = new THREE.CylinderGeometry(wheelRadius + 4.5, wheelRadius + 4.5, 3.5, 32);
      flangeGeo.rotateZ(Math.PI / 2);
      const flangeMesh = new THREE.Mesh(flangeGeo, steelAxleMat);
      flangeMesh.position.x = -wheelThickness / 2 - 1.75; // inner side
      wheelGroup.add(flangeMesh);

      // Hub & axle bolt hole
      const hubGeo = new THREE.CylinderGeometry(7, 7, wheelThickness + 4, 16);
      hubGeo.rotateZ(Math.PI / 2);
      const hubMesh = new THREE.Mesh(hubGeo, brassMat);
      wheelGroup.add(hubMesh);

      return wheelGroup;
    };

    // EIXO 1 (Traseiro)
    const axle1Group = new THREE.Group();
    axle1Group.position.set(0, wheelRadius, axleZ1);
    axle1GroupRef.current = axle1Group;

    // Steel axle shaft 8mm
    const axle1ShaftGeo = new THREE.CylinderGeometry(4, 4, railGauge + 30, 24);
    axle1ShaftGeo.rotateZ(Math.PI / 2);
    const axle1Shaft = new THREE.Mesh(axle1ShaftGeo, steelAxleMat);
    axle1Group.add(axle1Shaft);

    // Left & Right Wheels on Axle 1
    const wheel1Left = createWheelMesh();
    wheel1Left.position.set(-railGauge / 2, 0, 0);
    wheel1Left.rotation.y = Math.PI; // Face inward
    axle1Group.add(wheel1Left);

    const wheel1Right = createWheelMesh();
    wheel1Right.position.set(railGauge / 2, 0, 0);
    axle1Group.add(wheel1Right);

    // Driven Spur Gear M1.0 (45 dentes) on Axle 1
    const drivenGearGeo = new THREE.CylinderGeometry(23.5, 23.5, 8, 36);
    drivenGearGeo.rotateZ(Math.PI / 2);
    const drivenGearMesh = new THREE.Mesh(drivenGearGeo, brassMat);
    drivenGearMesh.position.x = -25; // Offset to mesh with motor pinion
    drivenGearRef.current = drivenGearMesh;
    axle1Group.add(drivenGearMesh);

    // Timing Pulley GT2 30T on Axle 1 (center)
    const pulley1Geo = new THREE.CylinderGeometry(9.6, 9.6, 12, 28);
    pulley1Geo.rotateZ(Math.PI / 2);
    const pulley1Mesh = new THREE.Mesh(pulley1Geo, aluminumPulleyMat);
    pulley1Mesh.position.x = 0; // Centered
    axle1Group.add(pulley1Mesh);

    // Pulley flanges
    const pFlange1Geo = new THREE.CylinderGeometry(12.5, 12.5, 1, 28);
    pFlange1Geo.rotateZ(Math.PI / 2);
    const pFlange1L = new THREE.Mesh(pFlange1Geo, aluminumPulleyMat);
    pFlange1L.position.x = -6.5;
    const pFlange1R = new THREE.Mesh(pFlange1Geo, aluminumPulleyMat);
    pFlange1R.position.x = 6.5;
    axle1Group.add(pFlange1L, pFlange1R);

    internalGroup.add(axle1Group);

    // EIXO 2 (Dianteiro)
    const axle2Group = new THREE.Group();
    axle2Group.position.set(0, wheelRadius, axleZ2);
    axle2GroupRef.current = axle2Group;

    // Steel axle shaft 8mm
    const axle2Shaft = new THREE.Mesh(axle1ShaftGeo.clone(), steelAxleMat);
    axle2Group.add(axle2Shaft);

    // Left & Right Wheels on Axle 2
    const wheel2Left = createWheelMesh();
    wheel2Left.position.set(-railGauge / 2, 0, 0);
    wheel2Left.rotation.y = Math.PI;
    axle2Group.add(wheel2Left);

    const wheel2Right = createWheelMesh();
    wheel2Right.position.set(railGauge / 2, 0, 0);
    axle2Group.add(wheel2Right);

    // Timing Pulley GT2 30T on Axle 2 (center)
    const pulley2Mesh = new THREE.Mesh(pulley1Geo.clone(), aluminumPulleyMat);
    pulley2Mesh.position.x = 0;
    axle2Group.add(pulley2Mesh);

    const pFlange2L = new THREE.Mesh(pFlange1Geo.clone(), aluminumPulleyMat);
    pFlange2L.position.x = -6.5;
    const pFlange2R = new THREE.Mesh(pFlange1Geo.clone(), aluminumPulleyMat);
    pFlange2R.position.x = 6.5;
    axle2Group.add(pFlange2L, pFlange2R);

    internalGroup.add(axle2Group);

    // --- 2. TIMING BELT GT2 (Connecting Axle 1 and Axle 2) ---
    // Procedural toothed belt loop
    // Generate texture for GT2 teeth
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1e293b'; // Dark neoprene
    ctx.fillRect(0, 0, 64, 256);
    // Draw GT2 teeth stripes
    ctx.fillStyle = '#0f172a';
    for (let y = 0; y < 256; y += 8) {
      ctx.fillRect(0, y, 64, 4);
    }
    const beltTexture = new THREE.CanvasTexture(canvas);
    beltTexture.wrapS = THREE.RepeatWrapping;
    beltTexture.wrapT = THREE.RepeatWrapping;
    beltTexture.repeat.set(1, 4);
    beltTextureRef.current = beltTexture;

    const beltMat = new THREE.MeshStandardMaterial({
      map: beltTexture,
      roughness: 0.85,
      metalness: 0.1,
      bumpScale: 0.05
    });

    const beltGroup = new THREE.Group();
    const beltWidth = 9.0;
    const pulleyRadius = 9.6;

    // Top straight span of belt
    const topSpanGeo = new THREE.BoxGeometry(beltWidth, 2.0, wheelbase);
    const topSpan = new THREE.Mesh(topSpanGeo, beltMat);
    topSpan.position.set(0, wheelRadius + pulleyRadius, 0);
    beltGroup.add(topSpan);

    // Bottom straight span of belt
    const bottomSpan = new THREE.Mesh(topSpanGeo, beltMat);
    bottomSpan.position.set(0, wheelRadius - pulleyRadius, 0);
    beltGroup.add(bottomSpan);

    // Curve around rear pulley
    const curveRearGeo = new THREE.CylinderGeometry(pulleyRadius + 1.0, pulleyRadius + 1.0, beltWidth, 20, 1, true, -Math.PI / 2, Math.PI);
    curveRearGeo.rotateZ(Math.PI / 2);
    const curveRear = new THREE.Mesh(curveRearGeo, beltMat);
    curveRear.position.set(0, wheelRadius, axleZ1);
    beltGroup.add(curveRear);

    // Curve around front pulley
    const curveFrontGeo = new THREE.CylinderGeometry(pulleyRadius + 1.0, pulleyRadius + 1.0, beltWidth, 20, 1, true, Math.PI / 2, Math.PI);
    curveFrontGeo.rotateZ(Math.PI / 2);
    const curveFront = new THREE.Mesh(curveFrontGeo, beltMat);
    curveFront.position.set(0, wheelRadius, axleZ2);
    beltGroup.add(curveFront);

    // Eccentric Belt Tensioner (Rolamento 608ZZ ajustável)
    const tensionerGeo = new THREE.CylinderGeometry(11, 11, 8, 24);
    tensionerGeo.rotateZ(Math.PI / 2);
    const tensionerMesh = new THREE.Mesh(tensionerGeo, steelAxleMat);
    tensionerMesh.position.set(0, wheelRadius + pulleyRadius + 6, 10);
    beltGroup.add(tensionerMesh);

    internalGroup.add(beltGroup);

    // --- 3. MOTOR DC 775 + REDUTOR PLANETÁRIO METÁLICO ---
    const motorGroup = new THREE.Group();
    // Motor body (RS-775 diameter 44mm, length 67mm)
    const motorCylinderGeo = new THREE.CylinderGeometry(22, 22, 65, 32);
    motorCylinderGeo.rotateX(Math.PI / 2);
    const motorCylinder = new THREE.Mesh(motorCylinderGeo, motorMetallicMat);
    motorGroup.add(motorCylinder);

    // Metallic planetary gearbox front housing (diameter 45mm, length 42mm)
    const gearboxGeo = new THREE.CylinderGeometry(22.5, 22.5, 38, 32);
    gearboxGeo.rotateX(Math.PI / 2);
    const gearboxMesh = new THREE.Mesh(gearboxGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }));
    gearboxMesh.position.z = -48;
    motorGroup.add(gearboxMesh);

    // Motor output shaft 8mm D-cut
    const motorShaftGeo = new THREE.CylinderGeometry(4, 4, 20, 16);
    motorShaftGeo.rotateX(Math.PI / 2);
    const motorShaft = new THREE.Mesh(motorShaftGeo, steelAxleMat);
    motorShaft.position.z = -75;
    motorGroup.add(motorShaft);

    // Motor Pinion Gear M1.0 (15 dentes)
    const pinionGeo = new THREE.CylinderGeometry(8.5, 8.5, 10, 24);
    pinionGeo.rotateZ(Math.PI / 2);
    const pinionMesh = new THREE.Mesh(pinionGeo, brassMat);
    pinionMesh.position.set(-25, 0, -20);
    motorPinionRef.current = pinionMesh;

    // Position entire motor assembly so pinion meshes with 45T spur gear
    motorGroup.position.set(-25, wheelRadius + 32, axleZ1);
    motorGroup.rotation.y = Math.PI / 2; // Transverse mounting with direct spur mesh
    internalGroup.add(motorGroup);

    // --- 4. 3D PRINTED CHASSIS STRUCTURE (PA12-CF / PETG) ---
    const chassisGroup = new THREE.Group();

    // Bottom structural floor plate
    const floorGeo = new THREE.BoxGeometry(175, 12, 310);
    const floorMesh = new THREE.Mesh(floorGeo, chassisCarbonMat);
    floorMesh.position.set(0, wheelRadius + 10, 0);
    floorMesh.castShadow = true;
    chassisGroup.add(floorMesh);

    // Axle Bearing Pillow Blocks (4x mancais p/ rolamentos F688ZZ)
    const blockGeo = new THREE.BoxGeometry(22, 28, 24);
    [-railGauge / 2 + 16, railGauge / 2 - 16].forEach((xPos) => {
      [axleZ1, axleZ2].forEach((zPos) => {
        const block = new THREE.Mesh(blockGeo, chassisCarbonMat);
        block.position.set(xPos, wheelRadius, zPos);
        chassisGroup.add(block);
      });
    });

    // Motor Mount Bracket
    const motorMountGeo = new THREE.BoxGeometry(55, 45, 14);
    const motorMount = new THREE.Mesh(motorMountGeo, chassisCarbonMat);
    motorMount.position.set(-25, wheelRadius + 32, axleZ1 + 35);
    chassisGroup.add(motorMount);

    // Battery Pack 4S LiPo (5200mAh)
    const batteryGeo = new THREE.BoxGeometry(45, 38, 138);
    const batteryMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const batteryMesh = new THREE.Mesh(batteryGeo, batteryMat);
    batteryMesh.position.set(40, wheelRadius + 32, 10);
    chassisGroup.add(batteryMesh);

    // Ballast Weight Compartment (Lastro de chumbo/aço para atingir 7.65 kg e maximizar tração)
    const ballastGeo = new THREE.BoxGeometry(70, 22, 90);
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.5 });
    const ballastMesh = new THREE.Mesh(ballastGeo, ballastMat);
    ballastMesh.position.set(0, wheelRadius + 22, -40);
    chassisGroup.add(ballastMesh);

    // Motor Driver BTS7960 43A (com dissipador de calor de alumínio)
    const driverGeo = new THREE.BoxGeometry(50, 20, 50);
    const heatsinkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const driverMesh = new THREE.Mesh(driverGeo, heatsinkMat);
    driverMesh.position.set(40, wheelRadius + 32, -90);
    chassisGroup.add(driverMesh);

    internalGroup.add(chassisGroup);

    // --- 5. HITCH SYSTEM (Engate Oficial Regulamento 105 - 110 mm) ---
    // Rule 3.b: Height measured from rail top = 105 to 110 mm. Exactly 107.5 mm!
    const hitchY = 107.5;
    const hitchGroup = new THREE.Group();

    // Rear Hitch bar & Pin (para cabo de guerra e puxar)
    const hitchBarGeo = new THREE.BoxGeometry(26, 12, 45);
    const hitchBarRear = new THREE.Mesh(hitchBarGeo, steelAxleMat);
    hitchBarRear.position.set(0, hitchY, -165);
    hitchGroup.add(hitchBarRear);

    // Steel Pin 6mm (Pino de acoplamento)
    const pinGeo = new THREE.CylinderGeometry(3.5, 3.5, 30, 16);
    const pinRear = new THREE.Mesh(pinGeo, brassMat);
    pinRear.position.set(0, hitchY, -175);
    hitchGroup.add(pinRear);

    // Front Hitch bar & Pin (para empurrar o vagão no "Helpers")
    const hitchBarFront = new THREE.Mesh(hitchBarGeo, steelAxleMat);
    hitchBarFront.position.set(0, hitchY, 165);
    hitchGroup.add(hitchBarFront);

    const pinFront = new THREE.Mesh(pinGeo, brassMat);
    pinFront.position.set(0, hitchY, 175);
    hitchGroup.add(pinFront);

    internalGroup.add(hitchGroup);

    // --- 6. AERODYNAMIC LOCOMOTIVE BODY SHELL (Onshape Reproduction) ---
    // Replicating the user's uploaded 3D CAD model:
    // Sleek curved front nose, side windows, door cutout, smooth aerodynamic canopy
    const locoLength = 335;
    const locoWidth = 205;
    const locoHeight = 245;

    // Outer Shell Composite
    // Main Cabin Box with curved bevels
    const mainCabinGeo = new THREE.BoxGeometry(locoWidth, locoHeight - 40, locoLength * 0.58);
    const mainCabin = new THREE.Mesh(mainCabinGeo, shellBlueMat);
    mainCabin.position.set(0, wheelRadius + (locoHeight - 40) / 2 + 10, -locoLength * 0.16);
    mainCabin.castShadow = true;
    shellGroup.add(mainCabin);

    // Aerodynamic Curved Front Nose (Bulbo/Frente Inclinada VLT)
    const noseGeo = new THREE.CylinderGeometry(locoWidth / 2, locoWidth / 2, locoLength * 0.42, 32, 1, false, 0, Math.PI);
    noseGeo.rotateZ(Math.PI / 2);
    noseGeo.rotateX(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, shellBlueMat);
    noseMesh.position.set(0, wheelRadius + (locoHeight - 40) / 2 + 10, locoLength * 0.22);
    noseMesh.scale.set(1.0, 1.05, 0.95);
    noseMesh.castShadow = true;
    shellGroup.add(noseMesh);

    // Front Sloped Windshield (Para-brisa panorâmico frontal)
    const frontWindshieldGeo = new THREE.BoxGeometry(locoWidth * 0.72, 65, 8);
    frontWindshieldGeo.rotateX(-Math.PI / 4);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, windowGlassMat);
    frontWindshield.position.set(0, wheelRadius + 140, locoLength * 0.28);
    shellGroup.add(frontWindshield);

    // Side Cab Windows (Left & Right)
    const sideWindowGeo = new THREE.BoxGeometry(8, 48, 70);
    const sideWindowL = new THREE.Mesh(sideWindowGeo, windowGlassMat);
    sideWindowL.position.set(-locoWidth / 2 - 2, wheelRadius + 130, 20);
    const sideWindowR = new THREE.Mesh(sideWindowGeo, windowGlassMat);
    sideWindowR.position.set(locoWidth / 2 + 2, wheelRadius + 130, 20);
    shellGroup.add(sideWindowL, sideWindowR);

    // Rear Side Door Cutout Glass
    const doorGlassGeo = new THREE.BoxGeometry(8, 75, 38);
    const doorGlassL = new THREE.Mesh(doorGlassGeo, windowGlassMat);
    doorGlassL.position.set(-locoWidth / 2 - 2, wheelRadius + 105, -70);
    const doorGlassR = new THREE.Mesh(doorGlassGeo, windowGlassMat);
    doorGlassR.position.set(locoWidth / 2 + 2, wheelRadius + 105, -70);
    shellGroup.add(doorGlassL, doorGlassR);

    // Aerodynamic Roof Cowling
    const roofGeo = new THREE.BoxGeometry(locoWidth * 0.92, 10, locoLength * 0.88);
    const roofMesh = new THREE.Mesh(roofGeo, shellBlueMat);
    roofMesh.position.set(0, wheelRadius + locoHeight - 25, 0);
    shellGroup.add(roofMesh);

    // Headlights (Faróis LED de alta potência frontais)
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8
    });
    const headlightGeo = new THREE.CylinderGeometry(7, 7, 6, 16);
    headlightGeo.rotateX(Math.PI / 2);
    const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
    headlightL.position.set(-50, wheelRadius + 60, locoLength * 0.46);
    const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
    headlightR.position.set(50, wheelRadius + 60, locoLength * 0.46);
    shellGroup.add(headlightL, headlightR);

    // --- 7. 3D TECHNICAL DIMENSION OVERLAYS (COTAS DO REGULAMENTO) ---
    // Dimension line: Bitola 150 mm
    const gaugeLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const gaugePts = [
      new THREE.Vector3(-railGauge / 2, -10, axleZ2 + 50),
      new THREE.Vector3(railGauge / 2, -10, axleZ2 + 50)
    ];
    const gaugeLineGeo = new THREE.BufferGeometry().setFromPoints(gaugePts);
    const gaugeLine = new THREE.Line(gaugeLineGeo, gaugeLineMat);
    dimensionsGroup.add(gaugeLine);

    // Dimension line: Hitch height (107.5 mm)
    const hitchLineMat = new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 });
    const hitchPts = [
      new THREE.Vector3(locoWidth / 2 + 25, 0, -175),
      new THREE.Vector3(locoWidth / 2 + 25, hitchY, -175)
    ];
    const hitchLineGeo = new THREE.BufferGeometry().setFromPoints(hitchPts);
    const hitchLine = new THREE.Line(hitchLineGeo, hitchLineMat);
    dimensionsGroup.add(hitchLine);

    // Wheelbase dimension line (160 mm)
    const wbPts = [
      new THREE.Vector3(-locoWidth / 2 - 25, wheelRadius, axleZ1),
      new THREE.Vector3(-locoWidth / 2 - 25, wheelRadius, axleZ2)
    ];
    const wbLineGeo = new THREE.BufferGeometry().setFromPoints(wbPts);
    const wbLine = new THREE.Line(wbLineGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }));
    dimensionsGroup.add(wbLine);

    locoMasterGroup.add(internalGroup);
    locoMasterGroup.add(shellGroup);
    locoMasterGroup.add(dimensionsGroup);

    scene.add(locoMasterGroup);
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              Visualizador 3D Interativo da Locomotiva
              <span className="text-[11px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Bitola 150 mm | AWD 4x4
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Arrasto para orbitar • Scroll para zoom • Simulação cinemática em tempo real
            </p>
          </div>
        </div>

        {/* View Mode Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('solid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'solid'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Montada (Sólida)
          </button>
          <button
            onClick={() => setViewMode('xray')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'xray'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Raio-X (Mecanismo)
          </button>
          <button
            onClick={() => setViewMode('transmission')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'transmission'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Transmissão 4x4
          </button>
          <button
            onClick={() => setViewMode('exploded')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'exploded'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Explodida
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-[520px] bg-gradient-to-b from-slate-950 to-slate-900 select-none cursor-grab active:cursor-grabbing">
        <div ref={mountRef} className="w-full h-full" />

        {/* Camera Quick View Overlay Buttons (Left) */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-lg text-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 py-0.5 font-bold">
            Ângulos de Câmera
          </span>
          <button
            onClick={() => setCameraView('iso')}
            className={`px-2.5 py-1 text-left rounded-md transition-colors ${
              activeCameraView === 'iso' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Perspectiva Isométrica
          </button>
          <button
            onClick={() => setCameraView('side')}
            className={`px-2.5 py-1 text-left rounded-md transition-colors ${
              activeCameraView === 'side' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vista Lateral (Elevação)
          </button>
          <button
            onClick={() => setCameraView('top')}
            className={`px-2.5 py-1 text-left rounded-md transition-colors ${
              activeCameraView === 'top' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vista Superior (Planta)
          </button>
          <button
            onClick={() => setCameraView('front')}
            className={`px-2.5 py-1 text-left rounded-md transition-colors ${
              activeCameraView === 'front' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vista Frontal (Bitola 150mm)
          </button>
          <button
            onClick={() => setCameraView('trans')}
            className={`px-2.5 py-1 text-left rounded-md transition-colors ${
              activeCameraView === 'trans' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Foco na Correia GT2 & Eixos
          </button>
        </div>

        {/* Live HUD Regulatory Badges (Right) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 max-w-[210px]">
          <div className="bg-slate-950/85 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs shadow-xl">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5">
              Cotas do Regulamento
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Bitola Roda:
                </span>
                <span className="font-mono font-bold text-cyan-400">150,0 mm</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Alt. Engate:
                </span>
                <span className="font-mono font-bold text-emerald-400">107,5 mm</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Entre-Eixos:
                </span>
                <span className="font-mono font-bold text-amber-400">160,0 mm</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Comprimento:</span>
                <span className="font-mono text-white">335 mm (&lt;360)</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Largura Máx:</span>
                <span className="font-mono text-white">205 mm (&lt;220)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Playback & Speed Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pausar Mecanismo' : 'Girar Mecanismo'}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-slate-400">Velocidade:</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-300 font-bold">{speedMultiplier.toFixed(1)}x</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
                className="rounded accent-cyan-400"
              />
              <span>Exibir Cotas 3D</span>
            </label>

            <span className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
              RPM Motor: <strong className="text-emerald-400">{Math.round(transmission.motorRpm * speedMultiplier)}</strong> | 
              Eixos 4WD: <strong className="text-cyan-400">{Math.round((transmission.motorRpm / 3) * speedMultiplier)} RPM</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
