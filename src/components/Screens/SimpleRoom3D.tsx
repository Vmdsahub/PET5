import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Bookmark, Package, Settings, Shield } from 'lucide-react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export const SimpleRoom3D: React.FC = () => {
  const { setCurrentScreen, user } = useGameStore();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: any;
  } | null>(null);

  useEffect(() => {
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
        // Left mouse button - orbital rotation
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

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchstart', onTouchStartZoom);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
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

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      
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
        className="absolute left-6 top-64 z-10 bg-white/95 backdrop-blur-2xl rounded-full py-2 px-2 shadow-lg border border-gray-100/50"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
      >
        <div className="flex flex-col space-y-2">
          {/* Globo */}
          <motion.button
            onClick={() => {}}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Globe className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
          </motion.button>

          {/* Catálogo */}
          <motion.button
            onClick={() => {}}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Bookmark className="w-5 h-5 text-green-600 group-hover:text-green-700 transition-colors" />
          </motion.button>

          {/* Inventário da Casa */}
          <motion.button
            onClick={() => {}}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Package className="w-5 h-5 text-orange-600 group-hover:text-orange-700 transition-colors" />
          </motion.button>

          {/* Configurações */}
          <motion.button
            onClick={() => {}}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
          </motion.button>

          {/* Separator */}
          <div className="w-5 h-px bg-gray-200/50 mx-auto my-1" />

          {/* Voltar */}
          <motion.button
            onClick={() => setCurrentScreen('world')}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-700 transition-colors" />
          </motion.button>

          {/* Admin Functions - Only show if user is admin */}
          {user?.isAdmin && (
            <>
              <div className="w-5 h-px bg-gray-200/50 mx-auto my-1" />
              <motion.button
                onClick={() => {}}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-50 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Shield className="w-5 h-5 text-red-600 group-hover:text-red-700 transition-colors" />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* Enhanced instructions */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-black/80 text-white rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🌌</div>
          <p className="text-sm font-medium mb-1">
            Sala 3D Interativa
          </p>
          <p className="text-xs text-gray-300 mb-1">
            🖱️ Esquerdo: Orbitar • Direito: Pan (H/V)
          </p>
          <p className="text-xs text-gray-300">
            🔍 Scroll: Zoom • 📱 Toque: arrastar/pinch
          </p>
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
      </motion.div>
    </div>
  );
};
