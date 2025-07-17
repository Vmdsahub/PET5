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
    this.scene.background = new THREE.Color("#f0f8ff");
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
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.targetElement.appendChild(this.renderer.domElement);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.target.set(0, 2, 0);
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

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
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
