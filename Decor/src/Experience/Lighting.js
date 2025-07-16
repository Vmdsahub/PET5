import * as THREE from 'three'
import Experience from './Experience.js'

export default class Lighting
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.debug = this.experience.debug

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder({
                title: 'lighting',
                expanded: true
            })
        }

        this.setLights()
    }

    setLights()
    {
        this.lights = {}

        // Ambient light
        this.lights.ambient = new THREE.AmbientLight('#ffffff', 0.4)
        this.scene.add(this.lights.ambient)

        // Directional light
        this.lights.directional = new THREE.DirectionalLight('#ffffff', 0.6)
        this.lights.directional.position.set(5, 10, 5)
        this.lights.directional.castShadow = true
        this.lights.directional.shadow.mapSize.width = 2048
        this.lights.directional.shadow.mapSize.height = 2048
        this.lights.directional.shadow.camera.near = 0.1
        this.lights.directional.shadow.camera.far = 50
        this.lights.directional.shadow.camera.left = -20
        this.lights.directional.shadow.camera.right = 20
        this.lights.directional.shadow.camera.top = 20
        this.lights.directional.shadow.camera.bottom = -20
        this.scene.add(this.lights.directional)

        // Ceiling light
        this.lights.ceiling = new THREE.PointLight('#ffffff', 0.4, 25)
        this.lights.ceiling.position.set(0, 9, 0)
        this.lights.ceiling.castShadow = true
        this.lights.ceiling.shadow.mapSize.width = 1024
        this.lights.ceiling.shadow.mapSize.height = 1024
        this.scene.add(this.lights.ceiling)

        // Debug
        if(this.debug)
        {
            this.debugFolder
                .addInput(
                    this.lights.ambient,
                    'intensity',
                    { label: 'Ambient Intensity', min: 0, max: 2 }
                )

            this.debugFolder
                .addInput(
                    this.lights.directional,
                    'intensity',
                    { label: 'Directional Intensity', min: 0, max: 2 }
                )

            this.debugFolder
                .addInput(
                    this.lights.ceiling,
                    'intensity',
                    { label: 'Ceiling Intensity', min: 0, max: 2 }
                )

            this.debugFolder
                .addInput(
                    this.lights.directional.position,
                    'x',
                    { label: 'Dir Light X', min: -20, max: 20 }
                )

            this.debugFolder
                .addInput(
                    this.lights.directional.position,
                    'y',
                    { label: 'Dir Light Y', min: 0, max: 20 }
                )

            this.debugFolder
                .addInput(
                    this.lights.directional.position,
                    'z',
                    { label: 'Dir Light Z', min: -20, max: 20 }
                )
        }
    }
}