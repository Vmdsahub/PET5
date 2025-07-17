import * as THREE from "three";
import { FurnitureManager } from "./FurnitureManager";

interface InteractionOptions {
  onObjectSelect?: (objectId: string | null) => void;
  furnitureManager: FurnitureManager;
}

export class InteractionManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isDragging: boolean = false;
  private selectedObject: string | null = null;
  private editMode: boolean = false;
  private onObjectSelect?: (objectId: string | null) => void;
  private furnitureManager: FurnitureManager;
  private dragPlane: THREE.Plane;
  private intersection: THREE.Vector3;
  private offset: THREE.Vector3;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    domElement: HTMLElement,
    options: InteractionOptions,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.furnitureManager = options.furnitureManager;
    this.onObjectSelect = options.onObjectSelect;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.intersection = new THREE.Vector3();
    this.offset = new THREE.Vector3();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener("click", this.onMouseClick.bind(this));
    this.domElement.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.domElement.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.domElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.domElement.addEventListener(
      "contextmenu",
      this.onContextMenu.bind(this),
    );
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onMouseClick(event: MouseEvent): void {
    if (!this.editMode || this.isDragging) return;

    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const objectId = this.furnitureManager.getFurnitureAt(this.raycaster);

    if (objectId !== this.selectedObject) {
      this.selectObject(objectId);
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if (!this.editMode || !this.selectedObject) return;

    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check if clicking on selected object
    const objectId = this.furnitureManager.getFurnitureAt(this.raycaster);

    if (objectId === this.selectedObject) {
      this.isDragging = true;
      this.domElement.style.cursor = "grabbing";

      // Calculate intersection with drag plane
      this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection);

      // Get object position and calculate offset
      const furniture = this.furnitureManager.getFurnitureById(
        this.selectedObject,
      );
      if (furniture) {
        this.offset.copy(this.intersection).sub(furniture.object.position);
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.editMode) return;

    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.isDragging && this.selectedObject) {
      // Move object
      this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection);
      const newPosition = this.intersection.clone().sub(this.offset);

      this.furnitureManager.moveObject(this.selectedObject, newPosition);
    } else if (this.editMode) {
      // Highlight object under cursor
      const objectId = this.furnitureManager.getFurnitureAt(this.raycaster);

      if (objectId) {
        this.domElement.style.cursor = "pointer";
      } else {
        this.domElement.style.cursor = "crosshair";
      }
    }
  }

  private onMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.domElement.style.cursor = this.editMode ? "crosshair" : "default";
    }
  }

  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();

    if (!this.editMode) return;

    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const objectId = this.furnitureManager.getFurnitureAt(this.raycaster);

    if (objectId) {
      // Rotate object on right click
      this.furnitureManager.rotateObject(objectId, Math.PI / 4);
    }
  }

  private selectObject(objectId: string | null): void {
    this.selectedObject = objectId;
    this.furnitureManager.highlightFurniture(objectId);

    if (this.onObjectSelect) {
      this.onObjectSelect(objectId);
    }
  }

  public setEditMode(editMode: boolean): void {
    this.editMode = editMode;

    if (!editMode) {
      // Clear selection when exiting edit mode
      this.selectObject(null);
      this.isDragging = false;
    }

    this.domElement.style.cursor = editMode ? "crosshair" : "default";
  }

  public getSelectedObject(): string | null {
    return this.selectedObject;
  }

  public clearSelection(): void {
    this.selectObject(null);
  }

  public destroy(): void {
    this.domElement.removeEventListener("click", this.onMouseClick.bind(this));
    this.domElement.removeEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
    );
    this.domElement.removeEventListener(
      "mousemove",
      this.onMouseMove.bind(this),
    );
    this.domElement.removeEventListener("mouseup", this.onMouseUp.bind(this));
    this.domElement.removeEventListener(
      "contextmenu",
      this.onContextMenu.bind(this),
    );
  }
}
