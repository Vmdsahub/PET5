import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export const SimpleRoom3D: React.FC = () => {
  const { setCurrentScreen } = useGameStore();
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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1); // Background preto
    mountRef.current.appendChild(renderer.domElement);

    // Add stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      sizeAttenuation: true
    });

    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      starsVertices.push(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Room setup - Floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    scene.add(floor);

    // Room setup - Walls
    const wallMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x444444,
      side: THREE.DoubleSide 
    });

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(10, 6);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 1, -5);
    scene.add(backWall);

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(10, 6);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-5, 1, 0);
    scene.add(leftWall);

    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(10, 6);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(5, 1, 0);
    scene.add(rightWall);

    // Camera position
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    // Simple orbit controls using mouse events
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const radius = 8;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetX += deltaX * 0.01;
      targetY += deltaY * 0.01;

      // Limit vertical rotation
      targetY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetY));

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Update camera position for orbit
      camera.position.x = Math.sin(targetX) * Math.cos(targetY) * radius;
      camera.position.y = Math.sin(targetY) * radius + 2;
      camera.position.z = Math.cos(targetX) * Math.cos(targetY) * radius;
      
      camera.lookAt(0, 0, 0);

      // Rotate stars slowly
      stars.rotation.y += 0.0005;

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
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      
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
        className="absolute top-6 left-6 z-10 px-4 py-2 bg-black/70 hover:bg-black/80 text-white rounded-full transition-colors font-medium flex items-center gap-2 backdrop-blur-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Mapa
      </motion.button>

      {/* Instructions */}
      <motion.div
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-black/70 text-white rounded-full backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <p className="text-sm text-center">
          🖱️ Clique e arraste para orbitar ao redor da sala
        </p>
      </motion.div>
    </div>
  );
};
