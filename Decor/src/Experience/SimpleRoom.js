import * as THREE from 'three'
import Experience from './Experience.js'

export default class SimpleRoom
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
                title: 'simpleRoom',
                expanded: true
            })
        }

        this.setRoom()
    }

    setRoom()
    {
        this.room = {}
        this.room.group = new THREE.Group()
        this.scene.add(this.room.group)

        // Materials
        this.room.materials = {}
        
        // Floor material
        this.room.materials.floor = new THREE.MeshStandardMaterial({
            color: '#8B7355',
            roughness: 0.8,
            metalness: 0.1
        })

        // Wall material
        this.room.materials.wall = new THREE.MeshStandardMaterial({
            color: '#E8E8E8',
            roughness: 0.9,
            metalness: 0.05
        })

        // Floor
        this.room.floor = {}
        this.room.floor.geometry = new THREE.PlaneGeometry(20, 20)
        this.room.floor.mesh = new THREE.Mesh(this.room.floor.geometry, this.room.materials.floor)
        this.room.floor.mesh.rotation.x = -Math.PI * 0.5
        this.room.floor.mesh.position.y = 0
        this.room.group.add(this.room.floor.mesh)

        // Back wall
        this.room.backWall = {}
        this.room.backWall.geometry = new THREE.PlaneGeometry(20, 10)
        this.room.backWall.mesh = new THREE.Mesh(this.room.backWall.geometry, this.room.materials.wall)
        this.room.backWall.mesh.position.z = -10
        this.room.backWall.mesh.position.y = 5
        this.room.group.add(this.room.backWall.mesh)

        // Left wall
        this.room.leftWall = {}
        this.room.leftWall.geometry = new THREE.PlaneGeometry(20, 10)
        this.room.leftWall.mesh = new THREE.Mesh(this.room.leftWall.geometry, this.room.materials.wall)
        this.room.leftWall.mesh.rotation.y = Math.PI * 0.5
        this.room.leftWall.mesh.position.x = -10
        this.room.leftWall.mesh.position.y = 5
        this.room.group.add(this.room.leftWall.mesh)

        // Right wall
        this.room.rightWall = {}
        this.room.rightWall.geometry = new THREE.PlaneGeometry(20, 10)
        this.room.rightWall.mesh = new THREE.Mesh(this.room.rightWall.geometry, this.room.materials.wall)
        this.room.rightWall.mesh.rotation.y = -Math.PI * 0.5
        this.room.rightWall.mesh.position.x = 10
        this.room.rightWall.mesh.position.y = 5
        this.room.group.add(this.room.rightWall.mesh)

        // Ceiling
        this.room.ceiling = {}
        this.room.ceiling.geometry = new THREE.PlaneGeometry(20, 20)
        this.room.ceiling.mesh = new THREE.Mesh(this.room.ceiling.geometry, this.room.materials.wall)
        this.room.ceiling.mesh.rotation.x = Math.PI * 0.5
        this.room.ceiling.mesh.position.y = 10
        this.room.group.add(this.room.ceiling.mesh)

        // Debug
        if(this.debug)
        {
            this.debugFolder
                .addInput(
                    this.room.materials.floor,
                    'color',
                    { view: 'color', label: 'Floor Color' }
                )

            this.debugFolder
                .addInput(
                    this.room.materials.wall,
                    'color',
                    { view: 'color', label: 'Wall Color' }
                )

            this.debugFolder
                .addInput(
                    this.room.materials.floor,
                    'roughness',
                    { label: 'Floor Roughness', min: 0, max: 1 }
                )

            this.debugFolder
                .addInput(
                    this.room.materials.wall,
                    'roughness',
                    { label: 'Wall Roughness', min: 0, max: 1 }
                )
        }
    }
}