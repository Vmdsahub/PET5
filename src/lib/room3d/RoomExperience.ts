import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RoomWorld } from "./RoomWorld";
import { RoomLighting } from "./RoomLighting";
import { FurnitureManager } from "./FurnitureManager";
import { InteractionManager } from "./InteractionManager";

interface RoomExperienceOptions {
  targetElement: HTMLElement;
  onObjectSelect?: (objectId: string | null) => void;
  editMode?: boolean;
}

export class RoomExperience {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private world: RoomWorld;
  private lighting: RoomLighting;
  private furnitureManager: FurnitureManager;
  private interactionManager: InteractionManager;
  private targetElement: HTMLElement;
  private animationId: number | null = null;
  private onObjectSelect?: (objectId: string | null) => void;

  // Smooth zoom variables
  private targetDistance: number = 15;
  private currentDistance: number = 15;
  private zoomVelocity: number = 0;
  private zoomDamping: number = 0.85;

  constructor(options: RoomExperienceOptions) {
    this.targetElement = options.targetElement;
    this.onObjectSelect = options.onObjectSelect;

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initWorld();
    this.initLighting();
    this.initFurniture();
    this.initInteraction();

    this.setEditMode(options.editMode || false);
    this.startAnimation();
    this.handleResize();
  }

  private initScene(): void {
    this.scene = new THREE.Scene();

    // Create deep space background with gradient
    const geometry = new THREE.SphereGeometry(100, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vWorldPosition;

        void main() {
          vec3 direction = normalize(vWorldPosition);
          float intensity = 1.0 - max(dot(direction, vec3(0.0, 1.0, 0.0)), 0.0);

          // Create subtle star field
          float stars = 0.0;
          for(int i = 0; i < 3; i++) {
            vec3 layer = direction * (float(i) + 1.0) * 50.0;
            stars += step(0.995, sin(layer.x) * sin(layer.y) * sin(layer.z)) * (1.0 - float(i) * 0.3);
          }

          // Deep space gradient
          vec3 spaceColor = mix(
            vec3(0.0, 0.0, 0.05), // Deep dark blue
            vec3(0.0, 0.0, 0.0),  // Pure black
            intensity
          );

          gl_FragColor = vec4(spaceColor + stars * 0.3, 1.0);
        }
      `,
      side: THREE.BackSide,
    });

    const skybox = new THREE.Mesh(geometry, material);
    this.scene.add(skybox);

    // Store reference for animation
    (this as any).skyboxMaterial = material;
  }

  private initCamera(): void {
    const rect = this.targetElement.getBoundingClientRect();
    this.camera = new THREE.PerspectiveCamera(
      75,
      rect.width / rect.height,
      0.1,
      1000,
    );
    this.camera.position.set(10, 8, 10);
    this.camera.lookAt(0, 0, 0);
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    const rect = this.targetElement.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Enable realistic lighting
    this.renderer.useLegacyLights = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.targetElement.appendChild(this.renderer.domElement);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.target.set(0, 2, 0);

    // Desabilitar zoom nativo para implementar nosso próprio
    this.controls.enableZoom = false;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.8;
    this.controls.rotateSpeed = 1.0;
    this.controls.screenSpacePanning = false;

    // Implementar zoom suave personalizado
    this.setupSmoothZoom();
  }

  private setupSmoothZoom(): void {
    // Inicializar distância
    this.targetDistance = this.camera.position.distanceTo(this.controls.target);
    this.currentDistance = this.targetDistance;

    // Interceptar eventos de wheel para zoom suave
    this.renderer.domElement.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();

        const delta = event.deltaY;
        const zoomFactor = delta > 0 ? 1.08 : 0.92;

        this.targetDistance *= zoomFactor;
        this.targetDistance = Math.max(5, Math.min(25, this.targetDistance));
      },
      { passive: false },
    );
  }

  private initWorld(): void {
    this.world = new RoomWorld(this.scene);
  }

  private initLighting(): void {
    this.lighting = new RoomLighting(this.scene);
  }

  private initFurniture(): void {
    this.furnitureManager = new FurnitureManager(this.scene);
  }

  private initInteraction(): void {
    this.interactionManager = new InteractionManager(
      this.scene,
      this.camera,
      this.renderer.domElement,
      {
        onObjectSelect: this.onObjectSelect,
        furnitureManager: this.furnitureManager,
      },
    );
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // Animate skybox for subtle movement
      if ((this as any).skyboxMaterial) {
        (this as any).skyboxMaterial.uniforms.time.value += 0.01;
      }

      // Smooth zoom interpolation
      this.updateSmoothZoom();

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private updateSmoothZoom(): void {
    // Interpolação suave entre distância atual e target
    const lerpFactor = 0.08; // Fator de suavização
    this.currentDistance +=
      (this.targetDistance - this.currentDistance) * lerpFactor;

    // Aplicar a nova distância à câmera
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();

    this.camera.position.copy(
      this.controls.target
        .clone()
        .add(direction.multiplyScalar(this.currentDistance)),
    );
  }

  private handleResize(): void {
    const resizeHandler = () => {
      const rect = this.targetElement.getBoundingClientRect();

      this.camera.aspect = rect.width / rect.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(rect.width, rect.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", resizeHandler);

    // Store reference for cleanup
    (this as any).resizeHandler = resizeHandler;
  }

  public setEditMode(editMode: boolean): void {
    this.interactionManager.setEditMode(editMode);
    this.controls.enabled = !editMode;
  }

  public rotateObject(objectId: string, rotation: number): void {
    this.furnitureManager.rotateObject(objectId, rotation);
  }

  public scaleObject(objectId: string, scale: number): void {
    this.furnitureManager.scaleObject(objectId, scale);
  }

  public moveObject(objectId: string, position: THREE.Vector3): void {
    this.furnitureManager.moveObject(objectId, position);
  }

  // Lighting controls for admin
  public updateLightIntensity(lightName: string, intensity: number): void {
    this.lighting.updateLightIntensity(lightName, intensity);
  }

  public updateLightColor(lightName: string, color: string): void {
    this.lighting.updateLightColor(lightName, color);
  }

  public updateLightPosition(lightName: string, position: THREE.Vector3): void {
    this.lighting.updateLightPosition(lightName, position);
  }

  public updateShadowSettings(
    lightName: string,
    settings: {
      mapSize?: number;
      bias?: number;
      enabled?: boolean;
    },
  ): void {
    this.lighting.updateShadowSettings(lightName, settings);
  }

  public setTimeOfDay(hour: number): void {
    this.lighting.setTimeOfDay(hour);
  }

  public getAllLights(): {
    [key: string]: {
      intensity: number;
      color: string;
      position: THREE.Vector3;
      castShadow: boolean;
    };
  } {
    return this.lighting.getAllLights();
  }

  // Room geometry controls for admin - Individual controls

  // Floor controls
  public updateFloorWidth(newWidth: number): void {
    this.world.updateFloorWidth(newWidth);
  }

  public updateFloorDepth(newDepth: number): void {
    this.world.updateFloorDepth(newDepth);
  }

  public updateFloorThickness(newThickness: number): void {
    this.world.updateFloorThickness(newThickness);
  }

  // Ceiling controls
  public updateCeilingWidth(newWidth: number): void {
    this.world.updateCeilingWidth(newWidth);
  }

  public updateCeilingDepth(newDepth: number): void {
    this.world.updateCeilingDepth(newDepth);
  }

  public updateCeilingThickness(newThickness: number): void {
    this.world.updateCeilingThickness(newThickness);
  }

  // Back wall controls
  public updateBackWallWidth(newWidth: number): void {
    this.world.updateBackWallWidth(newWidth);
  }

  public updateBackWallHeight(newHeight: number): void {
    this.world.updateBackWallHeight(newHeight);
  }

  // Left wall controls
  public updateLeftWallDepth(newDepth: number): void {
    this.world.updateLeftWallDepth(newDepth);
  }

  public updateLeftWallHeight(newHeight: number): void {
    this.world.updateLeftWallHeight(newHeight);
  }

  // Right wall controls
  public updateRightWallDepth(newDepth: number): void {
    this.world.updateRightWallDepth(newDepth);
  }

  public updateRightWallHeight(newHeight: number): void {
    this.world.updateRightWallHeight(newHeight);
  }

  // Wall thickness (affects all walls)
  public updateWallThickness(newThickness: number): void {
    this.world.updateWallThickness(newThickness);
  }

  // Legacy methods for backward compatibility
  public updateRoomSize(newSize: number): void {
    this.world.updateRoomSize(newSize);
  }

  public updateRoomHeight(newHeight: number): void {
    this.world.updateRoomHeight(newHeight);
  }

  public getRoomDimensions(): {
    size: number;
    height: number;
    wallThickness: number;
    floorThickness: number;
    ceilingThickness: number;
    floorWidth: number;
    floorDepth: number;
    ceilingWidth: number;
    ceilingDepth: number;
    backWallWidth: number;
    backWallHeight: number;
    leftWallDepth: number;
    leftWallHeight: number;
    rightWallDepth: number;
    rightWallHeight: number;
  } {
    return this.world.getRoomDimensions();
  }

  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    if ((this as any).resizeHandler) {
      window.removeEventListener("resize", (this as any).resizeHandler);
    }

    this.interactionManager.destroy();
    this.controls.dispose();
    this.renderer.dispose();

    if (this.targetElement.contains(this.renderer.domElement)) {
      this.targetElement.removeChild(this.renderer.domElement);
    }
  }
}
