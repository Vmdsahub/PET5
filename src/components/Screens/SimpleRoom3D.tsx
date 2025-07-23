import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, ShoppingCart, Package, Settings, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useGameStore } from '../../store/gameStore';
import { mockPersistenceService, CatalogItem, InventoryItem, PlacedFurniture } from '../../services/mockPersistenceService';

export const SimpleRoom3D: React.FC = () => {
  const { setCurrentScreen, user } = useGameStore();

  // Function to create 3D furniture representation
  const addFurnitureToScene = (furniture: PlacedFurniture, catalogItemId: string) => {
    if (!sceneRef.current) return;

    const catalogItem = catalogItems.find(c => c.id === catalogItemId);
    if (!catalogItem) return;

    // Create a simple geometric representation based on furniture type
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    // Different shapes for different furniture types
    if (catalogItem.name.toLowerCase().includes('mesa')) {
      // Table - box + thin top
      geometry = new THREE.BoxGeometry(1.5, 0.1, 1);
      material = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
    } else if (catalogItem.name.toLowerCase().includes('cadeira')) {
      // Chair - simple box
      geometry = new THREE.BoxGeometry(0.6, 1, 0.6);
      material = new THREE.MeshPhongMaterial({ color: 0x654321 }); // Dark brown
    } else if (catalogItem.name.toLowerCase().includes('sofá')) {
      // Sofa - wider box
      geometry = new THREE.BoxGeometry(2, 0.8, 0.8);
      material = new THREE.MeshPhongMaterial({ color: 0x4169E1 }); // Blue
    } else if (catalogItem.name.toLowerCase().includes('cama')) {
      // Bed - long box
      geometry = new THREE.BoxGeometry(2, 0.5, 1.5);
      material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF }); // White
    } else if (catalogItem.name.toLowerCase().includes('trono')) {
      // Throne - tall decorated chair
      geometry = new THREE.BoxGeometry(1, 1.5, 1);
      material = new THREE.MeshPhongMaterial({ color: 0xFFD700 }); // Gold
    } else {
      // Default furniture - simple box
      geometry = new THREE.BoxGeometry(1, 1, 1);
      material = new THREE.MeshPhongMaterial({ color: 0x888888 }); // Gray
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(furniture.position.x, furniture.position.y, furniture.position.z);
    mesh.rotation.set(furniture.rotation.x, furniture.rotation.y, furniture.rotation.z);
    mesh.scale.set(furniture.scale.x, furniture.scale.y, furniture.scale.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Store furniture ID for later reference
    mesh.userData = { furnitureId: furniture.id, inventoryItemId: furniture.inventoryItemId };

    sceneRef.current.scene.add(mesh);
  };

  // Function to load existing furniture from room data
  const loadExistingFurniture = () => {
    if (!sceneRef.current) return;

    const currentUser = mockPersistenceService.getCurrentUser();
    if (!currentUser) return;

    const room = mockPersistenceService.getUserRoom(currentUser.id);
    if (!room || !room.placedFurniture) return;

    room.placedFurniture.forEach(furniture => {
      const inventoryItem = inventoryItems.find(inv => inv.id === furniture.inventoryItemId);
      if (!inventoryItem) return;

      const catalogItem = catalogItems.find(c => c.id === inventoryItem.catalogItemId);
      if (catalogItem) {
        addFurnitureToScene(furniture, catalogItem.id);
      }
    });
  };



  // Função para capturar thumbnail do modelo GLB
  const captureModelThumbnail = (model: THREE.Group): Promise<string> => {
    return new Promise((resolve) => {
      // Criar cena temporária para captura
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true, // Fundo transparente
        preserveDrawingBuffer: true
      });

      renderer.setSize(128, 128);
      renderer.setClearColor(0x000000, 0); // Fundo transparente

      // Clonar modelo
      const modelClone = model.clone();
      scene.add(modelClone);

      // Calcular bounding box
      const box = new THREE.Box3().setFromObject(modelClone);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Centralizar modelo
      modelClone.position.sub(center);

      // Posicionar câmera para vista frontal
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 1.5;
      camera.position.set(0, 0, distance); // Vista frontal
      camera.lookAt(0, 0, 0);

      // Iluminação simples
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight.position.set(0, 0, 1);
      scene.add(directionalLight);

      // Renderizar e capturar
      renderer.render(scene, camera);
      const thumbnail = renderer.domElement.toDataURL('image/png');

      // Limpar recursos
      renderer.dispose();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      resolve(thumbnail);
    });
  };

  // Funções de upload GLB
  const handleFileSelect = async (file: File) => {
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        setSelectedFile(file);
        // Auto-fill model name from filename
        const nameWithoutExt = file.name.replace(/\.(glb|gltf)$/, '');
        setModelName(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));

        // Carregar o modelo GLB imediatamente
        setUploadStatus('loading');

        try {
          const loader = new GLTFLoader();
          const url = URL.createObjectURL(file);

          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
          });

          // Configurar o modelo
          const model = gltf.scene;
          model.scale.setScalar(1);
          model.position.set(0, 0, 0);

          // Adicionar sombras
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          setUploadedModel(model);

          // Capturar thumbnail do modelo
          const thumbnail = await captureModelThumbnail(model);
          setModelThumbnail(thumbnail);

          setUploadStatus('success');
          URL.revokeObjectURL(url);

        } catch (error) {
          console.error('Erro ao carregar modelo GLB:', error);
          setUploadStatus('error');
        }
      } else {
        alert('Arquivo muito grande! Máximo de 10MB permitido.');
      }
    } else {
      alert('Formato de arquivo não suportado! Use .glb ou .gltf');
    }
  };

  const handleAddToSection = async () => {
    if (!selectedFile || !modelName || !modelPrice || !modelThumbnail || uploadStatus !== 'success') {
      return;
    }

    const currentUser = mockPersistenceService.getCurrentUser();
    if (!currentUser || !currentUser.isAdmin) {
      alert('Apenas administradores podem adicionar itens ao catálogo.');
      return;
    }

    try {
      // Adicionar ao catálogo
      const newItem = mockPersistenceService.addToCatalog({
        name: modelName,
        emoji: modelThumbnail, // Usar thumbnail no lugar do emoji
        price: parseInt(modelPrice),
        category: modelCategory,
        createdBy: currentUser.id
      });

      // Update local state
      setCatalogItems(mockPersistenceService.getCatalog());

      // Limpar estado e fechar modal
      setSelectedFile(null);
      setModelName('');
      setModelPrice('');
      setModelThumbnail(null);
      setUploadedModel(null);
      setUploadStatus('idle');
      setShowUploadModal(false);

      alert(`Modelo "${modelName}" adicionado com sucesso ao catálogo!`);

    } catch (error) {
      alert('Erro ao adicionar item ao catálogo.');
      console.error(error);
    }
  };

  // Initialize game data
  const initializeGameData = () => {
    mockPersistenceService.init();

    // Set current user (simulate login)
    if (!mockPersistenceService.getCurrentUser()) {
      mockPersistenceService.setCurrentUser(user?.isAdmin ? 'admin-1' : 'player-1');
    }

    loadGameData();
  };

  const loadGameData = () => {
    const currentUser = mockPersistenceService.getCurrentUser();
    if (!currentUser) return;

    // Load catalog
    setCatalogItems(mockPersistenceService.getCatalog());

    // Load user inventory
    setInventoryItems(mockPersistenceService.getInventory(currentUser.id));

    // Load user room
    const room = mockPersistenceService.getUserRoom(currentUser.id);
    setPlacedFurniture(room?.placedFurniture || []);

    // Load user coins
    setUserCoins(currentUser.coins);
  };



  const handlePurchaseItem = (catalogItem: CatalogItem) => {
    const currentUser = mockPersistenceService.getCurrentUser();
    if (!currentUser) return;

    const result = mockPersistenceService.purchaseItem(currentUser.id, catalogItem.id);

    if (result.success) {
      // Update local states
      setInventoryItems(mockPersistenceService.getInventory(currentUser.id));
      const updatedUser = mockPersistenceService.getUserById(currentUser.id);
      if (updatedUser) {
        setUserCoins(updatedUser.coins);
      }
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const [showCatalog, setShowCatalog] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [expandedBasic, setExpandedBasic] = useState(true);
  const [expandedLimited, setExpandedLimited] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedModel, setUploadedModel] = useState<THREE.Group | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [modelName, setModelName] = useState('');
  const [modelPrice, setModelPrice] = useState('');
  const [modelCategory, setModelCategory] = useState<'Móveis Básicos' | 'Móveis Limitados'>('Móveis Básicos');
  const [modelThumbnail, setModelThumbnail] = useState<string | null>(null);
  const previewMountRef = useRef<HTMLDivElement>(null);
  const previewRendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Game data states
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [userCoins, setUserCoins] = useState(0);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string | null>(null);
  const [isDraggingOverScene, setIsDraggingOverScene] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: any;
  } | null>(null);

  useEffect(() => {
    // Initialize game data
    initializeGameData();

    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000511, 1); // Deep space blue-black
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);

    // Fog for atmospheric depth
    scene.fog = new THREE.Fog(0x000511, 15, 50);

    // Create realistic starfield with proper points
    const createStarField = () => {
      const starsGeometry = new THREE.BufferGeometry();
      const starPositions = [];
      const starColors = [];
      const starSizes = [];

      for (let i = 0; i < 2000; i++) {
        // Create stars in a sphere around the scene
        const radius = 80 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        starPositions.push(x, y, z);
        
        // Different star colors (white, blue-white, yellow-white)
        const starType = Math.random();
        if (starType < 0.7) {
          starColors.push(1, 1, 1); // White
        } else if (starType < 0.9) {
          starColors.push(0.8, 0.9, 1); // Blue-white
        } else {
          starColors.push(1, 0.9, 0.7); // Yellow-white
        }
        
        // Variable star sizes
        starSizes.push(Math.random() * 3 + 1);
      }

      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
      starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
      starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

      const starsMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float time;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            // Subtle twinkling effect
            float twinkle = sin(time * 3.0 + position.x * 0.01) * 0.3 + 0.7;
            gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          
          void main() {
            float distance = length(gl_PointCoord - vec2(0.5));
            if (distance > 0.5) discard;
            
            // Create a soft circular gradient
            float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
            alpha = pow(alpha, 2.0);
            
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      return new THREE.Points(starsGeometry, starsMaterial);
    };

    const stars = createStarField();
    scene.add(stars);

    // Ambient lighting for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // Main directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    // Additional point lights for atmospheric lighting
    const pointLight1 = new THREE.PointLight(0x4080ff, 0.8, 20);
    pointLight1.position.set(-3, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff8040, 0.6, 15);
    pointLight2.position.set(4, 2, -2);
    scene.add(pointLight2);

    // Room setup - Floor with better material
    const floorGeometry = new THREE.PlaneGeometry(12, 12);
    const floorMaterial = new THREE.MeshLambertMaterial({
      color: 0x2a2a2a
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Enhanced walls with better materials and lighting
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x3a3a3a
    });

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(12, 8);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 1.5, -6);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(12, 8);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-6, 1.5, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(12, 8);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(6, 1.5, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Front wall
    const frontWallGeometry = new THREE.PlaneGeometry(12, 8);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, 1.5, 6);
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(12, 12);
    const ceilingMaterial = new THREE.MeshLambertMaterial({
      color: 0x2a2a2a
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5.5;
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // Add some basic decorative elements
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x666666,
      shininess: 30
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(-2, -1.5, -2);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    // Another decorative element
    const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x888888,
      shininess: 50
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(3, -1.2, 1);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    // Camera position
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    // Enhanced orbit and pan controls using mouse events
    let isLeftMouseDown = false;
    let isRightMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    // Orbital rotation (left mouse button)
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    // Pan movement (right mouse button)
    let targetPanX = 0;
    let targetPanY = 1; // Start at room center
    let currentPanX = 0;
    let currentPanY = 1;

    // Zoom
    let targetRadius = 10;
    let currentRadius = 10;
    const minRadius = 3;
    const maxRadius = 20;

    const onMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (event.button === 0) {
        // Left mouse button - check for furniture click first
        if (!sceneRef.current) {
          isLeftMouseDown = true;
          return;
        }

        const rect = sceneRef.current.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, sceneRef.current.camera);

        // Check for furniture intersections
        if (sceneRef.current) {
          const furnitureObjects = sceneRef.current.scene.children.filter(child => child.userData && child.userData.furnitureId);
          const intersects = raycaster.intersectObjects(furnitureObjects);

          if (intersects.length > 0) {
            const clickedFurniture = intersects[0].object;
            const furnitureId = clickedFurniture.userData.furnitureId;

            // Right click removes furniture
            if (event.button === 2) {
              const currentUser = mockPersistenceService.getCurrentUser();
              if (currentUser) {
                mockPersistenceService.removeFurnitureFromRoom(currentUser.id, furnitureId);
                sceneRef.current.scene.remove(clickedFurniture);
                const room = mockPersistenceService.getUserRoom(currentUser.id);
                setPlacedFurniture(room?.placedFurniture || []);
              }
              return;
            }

            // Left click selects furniture (could add movement later)
            console.log('Clicked furniture:', furnitureId);
            return;
          }
        }

        // No furniture clicked, continue with orbital rotation
        isLeftMouseDown = true;
      } else if (event.button === 2) {
        // Right mouse button - pan movement
        isRightMouseDown = true;
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        isLeftMouseDown = false;
      } else if (event.button === 2) {
        isRightMouseDown = false;
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isLeftMouseDown && !isRightMouseDown) return;

      event.preventDefault();
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      if (isLeftMouseDown) {
        // Left mouse button - orbital rotation
        targetX += deltaX * 0.008;
        targetY += deltaY * 0.008;

        // Limit vertical rotation
        targetY = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetY));
      } else if (isRightMouseDown) {
        // Right mouse button - pan movement
        const panSpeed = 0.01;
        targetPanX -= deltaX * panSpeed;
        targetPanY += deltaY * panSpeed;

        // Limit pan movement to keep camera within reasonable bounds
        targetPanX = Math.max(-5, Math.min(5, targetPanX));
        targetPanY = Math.max(-2, Math.min(4, targetPanY));
      }

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    // Touch controls for mobile
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isLeftMouseDown = true;
        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isLeftMouseDown || event.touches.length !== 1) return;

      event.preventDefault();
      const deltaX = event.touches[0].clientX - mouseX;
      const deltaY = event.touches[0].clientY - mouseY;

      targetX += deltaX * 0.008;
      targetY += deltaY * 0.008;

      targetY = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetY));

      mouseX = event.touches[0].clientX;
      mouseY = event.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isLeftMouseDown = false;
    };

    // Zoom controls
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * 0.01;
      targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius + delta));
    };

    // Touch zoom (pinch gesture)
    let lastTouchDistance = 0;
    const onTouchStartZoom = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }
    };

    const onTouchMoveZoom = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const delta = (lastTouchDistance - currentDistance) * 0.02;
        targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius + delta));
        lastTouchDistance = currentDistance;
      }
    };

    // Disable context menu on right click
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    // Drag & Drop para móveis
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setIsDraggingOverScene(true);
      console.log('🔄 DragOver na cena 3D');
    };

    const onDragEnter = (event: DragEvent) => {
      event.preventDefault();
      setIsDraggingOverScene(true);
      console.log('🎯 DragEnter na cena 3D');
    };

    const onDragLeave = (event: DragEvent) => {
      // Only hide if leaving the canvas area
      if (event.target === sceneRef.current?.renderer.domElement) {
        setIsDraggingOverScene(false);
        console.log('🚫 DragLeave da cena 3D');
      }
    };

    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsDraggingOverScene(false);

      const inventoryItemId = event.dataTransfer.getData('inventoryItemId');
      const catalogItemId = event.dataTransfer.getData('catalogItemId');

      console.log('🎯 Drop detectado:', { inventoryItemId, catalogItemId });

      if (!inventoryItemId || !catalogItemId) {
        console.log('❌ Dados de drag incompletos');
        return;
      }

      const currentUser = mockPersistenceService.getCurrentUser();
      if (!currentUser || !sceneRef.current) return;

      // Check if item is already placed
      const isAlreadyPlaced = placedFurniture.some(f => f.inventoryItemId === inventoryItemId);
      if (isAlreadyPlaced) return;

      // Calculate 3D position from screen coordinates
      const rect = sceneRef.current.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Create raycaster to find position on floor
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, sceneRef.current.camera);

      // Find intersection with floor - get floor from scene
      const floor = sceneRef.current?.scene.children.find(child =>
        child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.PlaneGeometry &&
        child.rotation.x < 0 // Floor is rotated on X axis
      );

      console.log('🏠 Floor encontrado:', !!floor);

      let position = { x: 0, y: -1.5, z: 0 }; // Default position

      if (floor) {
        const floorIntersection = raycaster.intersectObject(floor);
        console.log('📍 Intersecções com o chão:', floorIntersection.length);

        if (floorIntersection.length > 0) {
          const point = floorIntersection[0].point;
          position = { x: point.x, y: -1.5, z: point.z }; // Position on floor level
          console.log('✅ Posição calculada:', position);
        }
      } else {
        // Fallback: place at screen center projected to floor level
        position = {
          x: (Math.random() - 0.5) * 8, // Random position within room bounds
          y: -1.5,
          z: (Math.random() - 0.5) * 8
        };
        console.log('🎲 Posição aleatória:', position);
      }

      // Add furniture to room
      const newFurniture = mockPersistenceService.addFurnitureToRoom(currentUser.id, {
        inventoryItemId,
        userId: currentUser.id,
        position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      });

      console.log('🏠 Móvel adicionado ao quarto:', newFurniture);

      // Update local state
      const room = mockPersistenceService.getUserRoom(currentUser.id);
      setPlacedFurniture(room?.placedFurniture || []);

      // Add 3D object to scene
      addFurnitureToScene(newFurniture, catalogItemId);

      console.log('✅ Móvel posicionado na cena 3D');
    };



    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchstart', onTouchStartZoom);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('dragenter', onDragEnter);
    renderer.domElement.addEventListener('dragover', onDragOver);
    renderer.domElement.addEventListener('dragleave', onDragLeave);
    renderer.domElement.addEventListener('drop', onDrop);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchmove', onTouchMoveZoom, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    // Animation loop with smooth interpolation
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      currentRadius += (targetRadius - currentRadius) * 0.08;
      currentPanX += (targetPanX - currentPanX) * 0.05;
      currentPanY += (targetPanY - currentPanY) * 0.05;

      // Update camera position for orbit with pan offset
      camera.position.x = Math.sin(currentX) * Math.cos(currentY) * currentRadius + currentPanX;
      camera.position.y = Math.sin(currentY) * currentRadius + currentPanY;
      camera.position.z = Math.cos(currentX) * Math.cos(currentY) * currentRadius;

      // Look at pan target point
      camera.lookAt(currentPanX, currentPanY, 0);

      // Update star twinkling
      if (stars.material instanceof THREE.ShaderMaterial) {
        stars.material.uniforms.time.value = elapsedTime;
      }

      // Subtle light animation
      pointLight1.intensity = 0.8 + Math.sin(elapsedTime * 0.5) * 0.2;
      pointLight2.intensity = 0.6 + Math.cos(elapsedTime * 0.7) * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    // Load existing furniture after scene is ready
    setTimeout(() => {
      loadExistingFurniture();
    }, 100);

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Store references for cleanup
    sceneRef.current = { scene, camera, renderer, controls: null };

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('dragenter', onDragEnter);
      renderer.domElement.removeEventListener('dragover', onDragOver);
      renderer.domElement.removeEventListener('dragleave', onDragLeave);
      renderer.domElement.removeEventListener('drop', onDrop);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      
      // Clean up geometries and materials
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, []);

  // Preview renderer para modelo GLB carregado
  useEffect(() => {
    if (!uploadedModel || !previewMountRef.current) return;

    // Limpar renderizador anterior
    if (previewRendererRef.current && previewMountRef.current.contains(previewRendererRef.current.domElement)) {
      previewMountRef.current.removeChild(previewRendererRef.current.domElement);
      previewRendererRef.current.dispose();
    }

    // Criar nova cena para preview
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(200, 200);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    previewRendererRef.current = renderer;

    // Adicionar modelo à cena
    const modelClone = uploadedModel.clone();
    scene.add(modelClone);

    // Calcular bounding box para centralizar o modelo
    const box = new THREE.Box3().setFromObject(modelClone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Centralizar modelo
    modelClone.position.sub(center);

    // Posicionar câmera
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    camera.position.set(distance, distance * 0.5, distance);
    camera.lookAt(0, 0, 0);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Adicionar ao DOM
    previewMountRef.current.appendChild(renderer.domElement);

    // Animação de rotação
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      modelClone.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (previewRendererRef.current && previewMountRef.current?.contains(previewRendererRef.current.domElement)) {
        previewMountRef.current.removeChild(previewRendererRef.current.domElement);
        previewRendererRef.current.dispose();
      }
    };
  }, [uploadedModel]);

  // Reload furniture when data changes
  useEffect(() => {
    if (sceneRef.current && catalogItems.length > 0 && inventoryItems.length > 0) {
      // Clear existing furniture from scene
      const furnitureObjects = sceneRef.current.scene.children.filter(
        child => child.userData && child.userData.furnitureId
      );
      furnitureObjects.forEach(obj => sceneRef.current?.scene.remove(obj));

      // Reload furniture
      setTimeout(() => {
        loadExistingFurniture();
      }, 50);
    }
  }, [placedFurniture, catalogItems, inventoryItems]);

  // Auto-save system
  useEffect(() => {
    const autoSave = () => {
      const currentUser = mockPersistenceService.getCurrentUser();
      if (!currentUser) return;

      // Save current state
      const room = mockPersistenceService.getUserRoom(currentUser.id);
      if (room) {
        room.lastModified = new Date().toISOString();
        mockPersistenceService.saveUserRoom(room);
        setLastSaved(new Date());
      }

      console.log('🔄 Auto-save executado');
    };

    // Auto-save every 30 seconds
    const interval = setInterval(autoSave, 30000);

    // Save on window unload
    const handleBeforeUnload = () => {
      autoSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Save on visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const currentUser = mockPersistenceService.getCurrentUser();
        if (currentUser) {
          const room = mockPersistenceService.getUserRoom(currentUser.id);
          if (room) {
            room.lastModified = new Date().toISOString();
            mockPersistenceService.saveUserRoom(room);
            setLastSaved(new Date());
            console.log('🔄 Auto-save ao trocar de aba');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />

      {/* Drag & Drop Overlay */}
      {isDraggingOverScene && (
        <motion.div
          className="absolute inset-0 bg-blue-500/20 border-4 border-dashed border-blue-400 flex items-center justify-center pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white/95 rounded-xl p-6 text-center shadow-lg">
            <motion.div
              className="text-3xl mb-3"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🏠
            </motion.div>
            <p className="text-sm font-medium text-gray-700">Solte aqui para posicionar o m��vel</p>
            <p className="text-xs text-gray-500 mt-1">O móvel será colocado no chão</p>
          </div>
        </motion.div>
      )}
      
      {/* Back button */}
      <motion.button
        onClick={() => setCurrentScreen('world')}
        className="absolute top-6 left-6 z-10 px-6 py-3 bg-black/80 hover:bg-black/90 text-white rounded-full transition-all duration-300 font-medium flex items-center gap-3 backdrop-blur-md border border-white/20 shadow-2xl"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar ao Mapa
      </motion.button>

      {/* Vertical Navigation Menu */}
      <motion.div
        className="absolute left-6 top-80 z-10 bg-white/95 backdrop-blur-2xl rounded-full py-1.5 px-1.5 shadow-lg border border-gray-100/50"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
      >
        <div className="flex flex-col space-y-1.5">
          {/* Globo */}
          <motion.button
            onClick={() => {}}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Globe className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-colors" />
          </motion.button>

          {/* Catálogo */}
          <motion.button
            onClick={() => setShowCatalog(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingCart className="w-4 h-4 text-green-600 group-hover:text-green-700 transition-colors" />
          </motion.button>

          {/* Inventário da Casa */}
          <motion.button
            onClick={() => setShowInventory(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Package className="w-4 h-4 text-orange-600 group-hover:text-orange-700 transition-colors" />
          </motion.button>

          {/* Configurações */}
          <motion.button
            onClick={() => {}}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings className="w-4 h-4 text-purple-600 group-hover:text-purple-700 transition-colors" />
          </motion.button>

          {/* Separator */}
          <div className="w-4 h-px bg-gray-200/50 mx-auto my-1" />

          {/* Voltar */}
          <motion.button
            onClick={() => setCurrentScreen('world')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-700 transition-colors" />
          </motion.button>


        </div>
      </motion.div>

      {/* Enhanced instructions */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-black/80 text-white rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🏠</div>
          <p className="text-sm font-medium mb-2">
            Jogo de Decoração 3D
          </p>
          <div className="text-xs text-gray-300 space-y-1">
            <p>🖱️ Orbitar: Clique esquerdo • Pan: Clique direito</p>
            <p>🔍 Zoom: Scroll • 📱 Mobile: toque/pinch</p>
            <p>🛒 Comprar: Catálogo → Inventário</p>
            <p>🏠 Decorar: Arrastar do inventário para sala</p>
            <p>❌ Remover: Clique direito no móvel</p>
          </div>
        </div>
      </motion.div>

      {/* Ambient info panel */}
      <motion.div
        className="absolute top-6 right-6 z-10 px-4 py-2 bg-black/60 text-white rounded-lg backdrop-blur-md border border-white/10"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-xs">Terra Verdejante • Sala Base</p>
        {lastSaved && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <p className="text-xs text-gray-300">
              Salvo {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </motion.div>



      {/* Inventário da Casa */}
      {showInventory && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay transparente */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowInventory(false)}
          />

          {/* Modal do Inventário */}
          <motion.div
            className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 max-w-3xl w-full mx-4 h-[70vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag
            dragConstraints={{ left: -200, right: 200, top: -100, bottom: 100 }}
            dragElastic={0.1}
          >
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Inventário da Casa
                </h2>
                <button
                  onClick={() => setShowInventory(false)}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                <div>
                  Itens: <span className="font-medium text-gray-700">{inventoryItems.length}/50</span>
                </div>
                <div>
                  Valor total: <span className="font-medium text-gray-700">
                    {inventoryItems.reduce((total, invItem) => {
                      const catalogItem = catalogItems.find(c => c.id === invItem.catalogItemId);
                      return total + (catalogItem?.price || 0);
                    }, 0)} moedas
                  </span>
                </div>
              </div>
            </div>

            {/* Conteúdo do Inventário */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-8 gap-3">
                {/* Móveis no inventário */}
                {inventoryItems.map((invItem) => {
                  const catalogItem = catalogItems.find(c => c.id === invItem.catalogItemId);
                  if (!catalogItem) return null;

                  const isPlaced = placedFurniture.some(f => f.inventoryItemId === invItem.id);

                  return (
                    <motion.div
                      key={invItem.id}
                      className={`
                        relative rounded-lg p-2 shadow-sm border-2 hover:shadow-md transition-all cursor-pointer group
                        ${catalogItem.category === 'Móveis Limitados'
                          ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300'
                          : 'bg-white border-gray-200'
                        }
                        ${isPlaced ? 'ring-2 ring-green-400' : ''}
                        ${selectedInventoryItem === invItem.id ? 'ring-2 ring-blue-400' : ''}
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedInventoryItem(selectedInventoryItem === invItem.id ? null : invItem.id)}
                      draggable={!isPlaced}
                      onDragStart={(e) => {
                        if (isPlaced) {
                          e.preventDefault();
                          return;
                        }
                        console.log('🎬 Iniciando drag do item:', catalogItem.name);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('inventoryItemId', invItem.id);
                        e.dataTransfer.setData('catalogItemId', catalogItem.id);
                        e.dataTransfer.setData('text/plain', catalogItem.name); // Fallback
                      }}
                      onDragEnd={(e) => {
                        console.log('🏁 Finalizando drag');
                      }}
                    >
                      {/* Status Badge */}
                      {isPlaced && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                      {!isPlaced && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                      )}

                      <div className="text-lg text-center mb-1">{catalogItem.emoji}</div>
                      <div className="text-xs font-medium text-gray-700 text-center truncate">
                        {catalogItem.name}
                      </div>

                      {/* Rarity indicator */}
                      <div className={`text-xs text-center mt-1 ${
                        catalogItem.category === 'Móveis Limitados' ? 'text-orange-600 font-medium' : 'text-gray-500'
                      }`}>
                        {catalogItem.category === 'Móveis Limitados' ? '⭐' : '•'}
                      </div>

                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-black/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center">
                          {isPlaced ? (
                            <button
                              className="text-xs text-red-400 hover:text-red-300 mb-1 block"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Remove from room
                                const currentUser = mockPersistenceService.getCurrentUser();
                                if (currentUser) {
                                  const furnitureToRemove = placedFurniture.find(f => f.inventoryItemId === invItem.id);
                                  if (furnitureToRemove) {
                                    mockPersistenceService.removeFurnitureFromRoom(currentUser.id, furnitureToRemove.id);
                                    const room = mockPersistenceService.getUserRoom(currentUser.id);
                                    setPlacedFurniture(room?.placedFurniture || []);
                                  }
                                }
                              }}
                            >
                              🗑️ Remover
                            </button>
                          ) : (
                            <div>
                              <div className="text-xs text-green-400 mb-1">
                                🖱️ Arrastar para sala
                              </div>
                              <div className="text-xs text-blue-400">
                                👁️ Click: Selecionar
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Slots vazios */}
                {Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-2 flex items-center justify-center"
                  >
                    <div className="text-center text-gray-400">
                      <div className="text-lg mb-1">📭</div>
                      <div className="text-xs">Vazio</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer com ações */}
            <div className="bg-white border-t border-gray-100 p-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Equipar Selecionados
                  </button>
                  <button className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Vender Selecionados
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></span>Equipado
                    <span className="w-2 h-2 bg-blue-500 rounded-full inline-block ml-3 mr-1"></span>Novo
                    <span className="text-yellow-600 ml-3">⭐</span>Limitado
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Catálogo de Móveis */}
      {showCatalog && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay transparente */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowCatalog(false)}
          />

          {/* Catálogo Principal */}
          <motion.div
            className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 max-w-4xl w-full mx-4 h-[80vh] flex overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag
            dragConstraints={{ left: -200, right: 200, top: -100, bottom: 100 }}
            dragElastic={0.1}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-white p-4 border-b border-gray-100 z-30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Catálogo de Móveis
                </h2>
                <div className="flex items-center gap-2">
                  {user?.isAdmin && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Upload GLB
                    </button>
                  )}
                  <button
                    onClick={() => setShowCatalog(false)}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex flex-1 pt-16">
              {/* Seções de Móveis */}
              <div className="w-80 overflow-y-auto p-4 space-y-4">
                {/* Móveis Básicos */}
                <section>
                  <button
                    onClick={() => setExpandedBasic(!expandedBasic)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h3 className="text-sm font-medium text-gray-800 flex items-center">
                      Móveis Básicos
                    </h3>
                    {expandedBasic ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  {expandedBasic && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {catalogItems
                        .filter(item => item.category === 'Móveis Básicos')
                        .map((item, index) => {
                          const colors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 'bg-orange-100', 'bg-pink-100', 'bg-indigo-100', 'bg-gray-100'];
                          const color = colors[index % colors.length];

                          return (
                            <motion.div
                              key={item.id}
                              className={`${color} rounded-lg p-2 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer relative group`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePurchaseItem(item)}
                            >
                              <div className="text-lg text-center mb-1">{item.emoji}</div>
                              <div className="text-xs font-medium text-gray-700 text-center truncate">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                {item.price}
                              </div>
                              <div className="absolute inset-0 bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-xs text-white font-medium">Comprar</span>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  )}
                </section>

                {/* Móveis Limitados */}
                <section>
                  <button
                    onClick={() => setExpandedLimited(!expandedLimited)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h3 className="text-sm font-medium text-gray-800 flex items-center">
                      <span className="text-yellow-500 mr-2">⭐</span>Móveis Limitados
                    </h3>
                    {expandedLimited ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  {expandedLimited && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {catalogItems
                        .filter(item => item.category === 'Móveis Limitados')
                        .map((item, index) => {
                          const colors = [
                            'bg-gradient-to-br from-yellow-200 to-yellow-300',
                            'bg-gradient-to-br from-purple-200 to-purple-300',
                            'bg-gradient-to-br from-blue-200 to-blue-300',
                            'bg-gradient-to-br from-gray-200 to-gray-300',
                            'bg-gradient-to-br from-red-200 to-red-300',
                            'bg-gradient-to-br from-green-200 to-green-300',
                            'bg-gradient-to-br from-orange-200 to-orange-300',
                            'bg-gradient-to-br from-pink-200 to-pink-300'
                          ];
                          const color = colors[index % colors.length];

                          return (
                            <motion.div
                              key={item.id}
                              className={`${color} rounded-lg p-2 shadow-sm border-2 border-yellow-300 hover:shadow-md transition-all cursor-pointer relative group`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePurchaseItem(item)}
                            >
                              <div className="text-lg text-center mb-1">{item.emoji}</div>
                              <div className="text-xs font-medium text-gray-700 text-center truncate">
                                {item.name}
                              </div>
                              <div className="text-xs text-orange-600 text-center font-medium">
                                {item.price}
                              </div>
                              <div className="absolute inset-0 bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-xs text-white font-medium">Comprar</span>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  )}
                </section>
              </div>

              {/* Área de Visualização Expandida */}
              <div className="flex-1 bg-gray-50/50 border-l border-gray-200/50 p-6">
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-white rounded-lg border-2 border-dashed border-gray-300 p-6">
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-6xl mb-6">🏠</div>
                        <p className="text-lg font-medium mb-2">Área de Visualização</p>
                        <p className="text-sm text-gray-400 mb-4">Clique em um móvel para ver detalhes e preview 3D</p>
                        <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-xs text-gray-600 mb-2">Controles:</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>🖱️ Rotacionar preview</div>
                            <div>🔍 Zoom in/out</div>
                            <div>📏 Ver dimensões</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Saldo: <span className="font-medium text-gray-700">{userCoins} moedas</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Clique nos itens para comprar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de Upload GLB */}
      {showUploadModal && user?.isAdmin && (
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setModelName('');
              setModelPrice('');
              setModelThumbnail(null);
              setUploadedModel(null);
              setUploadStatus('idle');
            }}
          />

          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Upload Modelo 3D</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setModelName('');
                    setModelPrice('');
                    setModelThumbnail(null);
                    setUploadedModel(null);
                    setUploadStatus('idle');
                  }}
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo GLB/GLTF
                </label>

                {uploadStatus === 'success' && uploadedModel ? (
                  <div className="border-2 border-green-400 bg-green-50 rounded-lg p-4 text-center">
                    <div ref={previewMountRef} className="w-full h-48 bg-gray-900 rounded-lg mb-3 flex items-center justify-center" />
                    <p className="text-sm text-green-700 font-medium">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-gray-500">Modelo carregado!</p>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        handleFileSelect(files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('upload-input')?.click()}
                  >
                    {uploadStatus === 'loading' ? (
                      <div>
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-blue-600">Carregando...</p>
                      </div>
                    ) : uploadStatus === 'error' ? (
                      <div>
                        <div className="text-red-500 text-2xl mb-2">⚠️</div>
                        <p className="text-sm text-red-600">Erro ao carregar</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 text-3xl mb-2">📁</div>
                        <p className="text-sm text-gray-600">
                          Arraste ou clique para selecionar
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          .glb, .gltf (máx. 10MB)
                        </p>
                      </div>
                    )}
                    <input
                      id="upload-input"
                      type="file"
                      className="hidden"
                      accept=".glb,.gltf"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleFileSelect(files[0]);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Móvel
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Ex: Porta Moderna"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço
                  </label>
                  <input
                    type="number"
                    value={modelPrice}
                    onChange={(e) => setModelPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={modelCategory}
                    onChange={(e) => setModelCategory(e.target.value as 'Móveis Básicos' | 'Móveis Limitados')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="Móveis Básicos">Móveis Básicos</option>
                    <option value="Móveis Limitados">Móveis Limitados</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setModelName('');
                    setModelPrice('');
                    setModelThumbnail(null);
                    setUploadedModel(null);
                    setUploadStatus('idle');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddToSection}
                  disabled={!selectedFile || !modelName || !modelPrice || !modelThumbnail || uploadStatus !== 'success'}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedFile && modelName && modelPrice && modelThumbnail && uploadStatus === 'success'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Adicionar à {modelCategory}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
