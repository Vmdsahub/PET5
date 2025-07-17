import * as THREE from "three";

export class RoomLighting {
  private scene: THREE.Scene;
  private lights: { [key: string]: THREE.Light };

  // Default lighting values for reset functionality
  private readonly defaultLightSettings = {
    ambient: { intensity: 0.3, color: "#ffffff" },
    directional: {
      intensity: 0.8,
      color: "#fff8e1",
      position: { x: 8, y: 12, z: 8 },
      castShadow: true,
    },
    ceiling: {
      intensity: 0.6,
      color: "#ffffff",
      position: { x: 0, y: 9.5, z: 0 },
      castShadow: true,
    },
    corner1: {
      intensity: 0.4,
      color: "#ffb366",
      position: { x: -8, y: 3, z: -8 },
      castShadow: true,
    },
    corner2: {
      intensity: 0.4,
      color: "#ffb366",
      position: { x: 8, y: 3, z: -8 },
      castShadow: true,
    },
    fill: {
      intensity: 0.2,
      color: "#e3f2fd",
      position: { x: 0, y: 5, z: 15 },
      castShadow: false,
    },
  };

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

  public getLightIntensity(lightName: string): number {
    return this.lights[lightName]?.intensity || 0;
  }

  public getLightColor(lightName: string): string {
    return this.lights[lightName]?.color.getHexString() || "#ffffff";
  }

  public updateLightPosition(lightName: string, position: THREE.Vector3): void {
    if (this.lights[lightName]) {
      this.lights[lightName].position.copy(position);
    }
  }

  public getLightPosition(lightName: string): THREE.Vector3 {
    return this.lights[lightName]?.position.clone() || new THREE.Vector3();
  }

  public updateShadowSettings(
    lightName: string,
    settings: {
      mapSize?: number;
      bias?: number;
      enabled?: boolean;
    },
  ): void {
    const light = this.lights[lightName];
    if (light && "shadow" in light) {
      const shadowLight = light as THREE.DirectionalLight | THREE.PointLight;
      if (settings.mapSize) {
        shadowLight.shadow.mapSize.width = settings.mapSize;
        shadowLight.shadow.mapSize.height = settings.mapSize;
      }
      if (settings.bias !== undefined) {
        shadowLight.shadow.bias = settings.bias;
      }
      if (settings.enabled !== undefined) {
        shadowLight.castShadow = settings.enabled;
      }
    }
  }

  public getAllLights(): {
    [key: string]: {
      intensity: number;
      color: string;
      position: THREE.Vector3;
      castShadow: boolean;
    };
  } {
    const lightData: any = {};
    Object.keys(this.lights).forEach((name) => {
      const light = this.lights[name];
      lightData[name] = {
        intensity: light.intensity,
        color: "#" + light.color.getHexString(),
        position: light.position.clone(),
        castShadow: "castShadow" in light ? light.castShadow : false,
      };
    });
    return lightData;
  }

  // Reset lighting to default values
  public resetToDefaults(): void {
    // Reset ambient light
    this.updateLightIntensity(
      "ambient",
      this.defaultLightSettings.ambient.intensity,
    );
    this.updateLightColor("ambient", this.defaultLightSettings.ambient.color);

    // Reset directional light
    this.updateLightIntensity(
      "directional",
      this.defaultLightSettings.directional.intensity,
    );
    this.updateLightColor(
      "directional",
      this.defaultLightSettings.directional.color,
    );
    this.updateLightPosition(
      "directional",
      new THREE.Vector3(
        this.defaultLightSettings.directional.position.x,
        this.defaultLightSettings.directional.position.y,
        this.defaultLightSettings.directional.position.z,
      ),
    );

    // Reset ceiling light
    this.updateLightIntensity(
      "ceiling",
      this.defaultLightSettings.ceiling.intensity,
    );
    this.updateLightColor("ceiling", this.defaultLightSettings.ceiling.color);
    this.updateLightPosition(
      "ceiling",
      new THREE.Vector3(
        this.defaultLightSettings.ceiling.position.x,
        this.defaultLightSettings.ceiling.position.y,
        this.defaultLightSettings.ceiling.position.z,
      ),
    );

    // Reset corner lights
    this.updateLightIntensity(
      "corner1",
      this.defaultLightSettings.corner1.intensity,
    );
    this.updateLightColor("corner1", this.defaultLightSettings.corner1.color);
    this.updateLightPosition(
      "corner1",
      new THREE.Vector3(
        this.defaultLightSettings.corner1.position.x,
        this.defaultLightSettings.corner1.position.y,
        this.defaultLightSettings.corner1.position.z,
      ),
    );

    this.updateLightIntensity(
      "corner2",
      this.defaultLightSettings.corner2.intensity,
    );
    this.updateLightColor("corner2", this.defaultLightSettings.corner2.color);
    this.updateLightPosition(
      "corner2",
      new THREE.Vector3(
        this.defaultLightSettings.corner2.position.x,
        this.defaultLightSettings.corner2.position.y,
        this.defaultLightSettings.corner2.position.z,
      ),
    );

    // Reset fill light
    this.updateLightIntensity("fill", this.defaultLightSettings.fill.intensity);
    this.updateLightColor("fill", this.defaultLightSettings.fill.color);
    this.updateLightPosition(
      "fill",
      new THREE.Vector3(
        this.defaultLightSettings.fill.position.x,
        this.defaultLightSettings.fill.position.y,
        this.defaultLightSettings.fill.position.z,
      ),
    );

    // Reset shadow settings
    Object.keys(this.lights).forEach((lightName) => {
      const defaultSettings =
        this.defaultLightSettings[
          lightName as keyof typeof this.defaultLightSettings
        ];
      if (defaultSettings && "castShadow" in defaultSettings) {
        this.updateShadowSettings(lightName, {
          enabled: defaultSettings.castShadow,
        });
      }
    });
  }
}
