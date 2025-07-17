import * as THREE from "three";
import Experience from "./Experience.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";

export default class Renderer {
  constructor(_options = {}) {
    this.experience = new Experience();
    this.config = this.experience.config;
    this.debug = this.experience.debug;
    this.stats = this.experience.stats;
    this.time = this.experience.time;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;

    this.usePostprocess = true;

    this.setInstance();
    this.setPostProcess();
    this.setDebugControls();
  }

  setInstance() {
    this.clearColor = "#010101";

    // Renderer
    this.instance = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
    });
    this.instance.domElement.style.position = "absolute";
    this.instance.domElement.style.top = 0;
    this.instance.domElement.style.left = 0;
    this.instance.domElement.style.width = "100%";
    this.instance.domElement.style.height = "100%";

    // this.instance.setClearColor(0x414141, 1)
    this.instance.setClearColor(this.clearColor, 1);
    this.instance.setSize(this.config.width, this.config.height);
    this.instance.setPixelRatio(this.config.pixelRatio);

    // Enhanced rendering settings
    this.instance.physicallyCorrectLights = true;
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.instance.shadowMap.enabled = true;

    // Advanced tone mapping settings
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.0;

    // Enable additional rendering features
    this.instance.localClippingEnabled = true;
    this.instance.sortObjects = true;
    this.instance.autoClear = true;

    // Performance optimizations
    this.instance.powerPreference = "high-performance";
    this.instance.precision = "highp";

    this.context = this.instance.getContext();

    // Add stats panel
    if (this.stats) {
      this.stats.setRenderPanel(this.context);
    }
  }

  setPostProcess() {
    this.postProcess = {};

    /**
     * Render pass
     */
    this.postProcess.renderPass = new RenderPass(
      this.scene,
      this.camera.instance,
    );

    /**
     * Effect composer
     */
    const RenderTargetClass =
      this.config.pixelRatio >= 2
        ? THREE.WebGLRenderTarget
        : THREE.WebGLMultisampleRenderTarget;
    // const RenderTargetClass = THREE.WebGLRenderTarget
    this.renderTarget = new RenderTargetClass(
      this.config.width,
      this.config.height,
      {
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
        encoding: THREE.sRGBEncoding,
      },
    );
    this.postProcess.composer = new EffectComposer(
      this.instance,
      this.renderTarget,
    );
    this.postProcess.composer.setSize(this.config.width, this.config.height);
    this.postProcess.composer.setPixelRatio(this.config.pixelRatio);

    this.postProcess.composer.addPass(this.postProcess.renderPass);

    // SAO (Screen Space Ambient Occlusion)
    this.postProcess.saoPass = new SAOPass(
      this.scene,
      this.camera.instance,
      this.config.width,
      this.config.height,
    );
    this.postProcess.saoPass.params.saoBias = 0.5;
    this.postProcess.saoPass.params.saoIntensity = 0.18;
    this.postProcess.saoPass.params.saoScale = 1;
    this.postProcess.saoPass.params.saoKernelRadius = 100;
    this.postProcess.saoPass.params.saoMinResolution = 0;
    this.postProcess.composer.addPass(this.postProcess.saoPass);

    // Bloom effect
    this.postProcess.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.config.width, this.config.height),
      0.5, // strength
      0.8, // radius
      0.7, // threshold
    );
    this.postProcess.composer.addPass(this.postProcess.bloomPass);

    // Anti-aliasing
    this.postProcess.smaaPass = new SMAAPass(
      this.config.width,
      this.config.height,
    );
    this.postProcess.composer.addPass(this.postProcess.smaaPass);
  }

  resize() {
    // Instance
    this.instance.setSize(this.config.width, this.config.height);
    this.instance.setPixelRatio(this.config.pixelRatio);

    // Post process
    this.postProcess.composer.setSize(this.config.width, this.config.height);
    this.postProcess.composer.setPixelRatio(this.config.pixelRatio);
  }

  update() {
    if (this.stats) {
      this.stats.beforeRender();
    }

    if (this.usePostprocess) {
      this.postProcess.composer.render();
    } else {
      this.instance.render(this.scene, this.camera.instance);
    }

    if (this.stats) {
      this.stats.afterRender();
    }
  }

  setDebugControls() {
    if (this.debug) {
      const renderingFolder = this.debug.addFolder({
        title: "Advanced Rendering",
        expanded: true,
      });

      // Tone mapping controls
      const toneMappingOptions = {
        None: THREE.NoToneMapping,
        Linear: THREE.LinearToneMapping,
        Reinhard: THREE.ReinhardToneMapping,
        Cineon: THREE.CineonToneMapping,
        "ACES Filmic": THREE.ACESFilmicToneMapping,
      };

      renderingFolder
        .addInput({ toneMapping: "ACES Filmic" }, "toneMapping", {
          options: toneMappingOptions,
        })
        .on("change", (e) => {
          this.instance.toneMapping = toneMappingOptions[e.value];
        });

      renderingFolder.addInput(this.instance, "toneMappingExposure", {
        min: 0,
        max: 3,
        step: 0.1,
      });

      // Post-processing controls
      const postProcessFolder = renderingFolder.addFolder({
        title: "Post Processing",
        expanded: false,
      });

      postProcessFolder.addInput(this, "usePostprocess", {
        label: "Enable Post Processing",
      });

      // SAO controls
      const saoFolder = postProcessFolder.addFolder({
        title: "Ambient Occlusion",
        expanded: false,
      });

      saoFolder.addInput(this.postProcess.saoPass.params, "saoIntensity", {
        label: "Intensity",
        min: 0,
        max: 1,
        step: 0.01,
      });

      saoFolder.addInput(this.postProcess.saoPass.params, "saoBias", {
        label: "Bias",
        min: 0,
        max: 1,
        step: 0.01,
      });

      // Bloom controls
      const bloomFolder = postProcessFolder.addFolder({
        title: "Bloom",
        expanded: false,
      });

      bloomFolder.addInput(this.postProcess.bloomPass, "strength", {
        label: "Strength",
        min: 0,
        max: 3,
        step: 0.1,
      });

      bloomFolder.addInput(this.postProcess.bloomPass, "radius", {
        label: "Radius",
        min: 0,
        max: 1,
        step: 0.1,
      });

      bloomFolder.addInput(this.postProcess.bloomPass, "threshold", {
        label: "Threshold",
        min: 0,
        max: 1,
        step: 0.1,
      });
    }
  }

  destroy() {
    this.instance.renderLists.dispose();
    this.instance.dispose();
    this.renderTarget.dispose();
    this.postProcess.composer.renderTarget1.dispose();
    this.postProcess.composer.renderTarget2.dispose();
  }
}
