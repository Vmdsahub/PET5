import * as THREE from "three";

export class RoomLighting {
  private scene: THREE.Scene;
  private lights: { [key: string]: THREE.Light };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.lights = {};
    this.createLights();
  }

  private createLights(): void {
    // Ambient light for general illumination
    this.createAmbientLight();

    // Main directional light (sunlight through window)
    this.createDirectionalLight();

    // Ceiling light
    this.createCeilingLight();

    // Corner accent lights
    this.createAccentLights();
  }

  private createAmbientLight(): void {
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.3);
    this.lights.ambient = ambientLight;
    this.scene.add(ambientLight);
  }

  private createDirectionalLight(): void {
    const directionalLight = new THREE.DirectionalLight("#fff8e1", 0.8);
    directionalLight.position.set(8, 12, 8);
    directionalLight.target.position.set(0, 0, 0);

    // Enable shadows
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.0001;

    this.lights.directional = directionalLight;
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);
  }

  private createCeilingLight(): void {
    // Main ceiling light
    const ceilingLight = new THREE.PointLight("#ffffff", 0.6, 25, 2);
    ceilingLight.position.set(0, 9.5, 0);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.width = 1024;
    ceilingLight.shadow.mapSize.height = 1024;
    ceilingLight.shadow.bias = -0.0001;

    this.lights.ceiling = ceilingLight;
    this.scene.add(ceilingLight);

    // Visual representation of ceiling light
    const lightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.8,
    });
    const lightSphere = new THREE.Mesh(lightGeometry, lightMaterial);
    lightSphere.position.copy(ceilingLight.position);
    lightSphere.position.y -= 0.3;
    this.scene.add(lightSphere);
  }

  private createAccentLights(): void {
    // Warm corner light 1
    const cornerLight1 = new THREE.PointLight("#ffb366", 0.4, 8, 2);
    cornerLight1.position.set(-8, 3, -8);
    cornerLight1.castShadow = true;
    cornerLight1.shadow.mapSize.width = 512;
    cornerLight1.shadow.mapSize.height = 512;

    this.lights.corner1 = cornerLight1;
    this.scene.add(cornerLight1);

    // Warm corner light 2
    const cornerLight2 = new THREE.PointLight("#ffb366", 0.4, 8, 2);
    cornerLight2.position.set(8, 3, -8);
    cornerLight2.castShadow = true;
    cornerLight2.shadow.mapSize.width = 512;
    cornerLight2.shadow.mapSize.height = 512;

    this.lights.corner2 = cornerLight2;
    this.scene.add(cornerLight2);

    // Soft fill light from front
    const fillLight = new THREE.DirectionalLight("#e3f2fd", 0.2);
    fillLight.position.set(0, 5, 15);
    fillLight.target.position.set(0, 0, 0);

    this.lights.fill = fillLight;
    this.scene.add(fillLight);
    this.scene.add(fillLight.target);
  }

  public addFurnitureLight(
    position: THREE.Vector3,
    color: string = "#ffb366",
    intensity: number = 0.5,
  ): THREE.PointLight {
    const furnitureLight = new THREE.PointLight(color, intensity, 6, 2);
    furnitureLight.position.copy(position);
    furnitureLight.castShadow = true;
    furnitureLight.shadow.mapSize.width = 512;
    furnitureLight.shadow.mapSize.height = 512;
    furnitureLight.shadow.bias = -0.0001;

    this.scene.add(furnitureLight);
    return furnitureLight;
  }

  public updateLightIntensity(lightName: string, intensity: number): void {
    if (this.lights[lightName]) {
      this.lights[lightName].intensity = intensity;
    }
  }

  public updateLightColor(lightName: string, color: string): void {
    if (this.lights[lightName]) {
      this.lights[lightName].color.set(color);
    }
  }

  public setTimeOfDay(hour: number): void {
    // Simulate different times of day
    let ambientIntensity = 0.3;
    let directionalIntensity = 0.8;
    let directionalColor = "#fff8e1";

    if (hour < 6 || hour > 20) {
      // Night time
      ambientIntensity = 0.1;
      directionalIntensity = 0.1;
      directionalColor = "#4a5568";
    } else if (hour < 8 || hour > 18) {
      // Dawn/dusk
      ambientIntensity = 0.2;
      directionalIntensity = 0.4;
      directionalColor = "#ffa726";
    }

    this.updateLightIntensity("ambient", ambientIntensity);
    this.updateLightIntensity("directional", directionalIntensity);
    this.updateLightColor("directional", directionalColor);
  }
}
