import * as THREE from 'three'
import Experience from './Experience.js'

export default class Furniture
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
                title: 'furniture',
                expanded: true
            })
        }

        this.setMaterials()
        this.setFurniture()
    }

    setMaterials()
    {
        this.materials = {}

        // Wood material
        this.materials.wood = new THREE.MeshStandardMaterial({
            color: '#8B4513',
            roughness: 0.7,
            metalness: 0.1
        })

        // Metal material
        this.materials.metal = new THREE.MeshStandardMaterial({
            color: '#C0C0C0',
            roughness: 0.3,
            metalness: 0.8
        })

        // Fabric material
        this.materials.fabric = new THREE.MeshStandardMaterial({
            color: '#4A4A4A',
            roughness: 0.9,
            metalness: 0.0
        })

        // Lamp shade material
        this.materials.lampShade = new THREE.MeshStandardMaterial({
            color: '#F5F5DC',
            roughness: 0.8,
            metalness: 0.0
        })

        // Glass material
        this.materials.glass = new THREE.MeshStandardMaterial({
            color: '#FFFFFF',
            roughness: 0.1,
            metalness: 0.0,
            transparent: true,
            opacity: 0.3
        })
    }

    setFurniture()
    {
        this.furniture = {}
        this.furniture.group = new THREE.Group()
        this.scene.add(this.furniture.group)

        // Table
        this.createTable()
        
        // Chair
        this.createChair()
        
        // Lamp with light
        this.createLamp()
        
        // Bookshelf (wall furniture)
        this.createBookshelf()
        
        // Wall picture frame
        this.createPictureFrame()
        
        // Sofa
        this.createSofa()
    }

    createTable()
    {
        const table = new THREE.Group()

        // Table top
        const topGeometry = new THREE.BoxGeometry(3, 0.1, 1.5)
        const topMesh = new THREE.Mesh(topGeometry, this.materials.wood)
        topMesh.position.y = 1.5
        topMesh.castShadow = true
        topMesh.receiveShadow = true
        table.add(topMesh)

        // Table legs
        const legGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.1)
        const positions = [
            [-1.4, 0.75, -0.7],
            [1.4, 0.75, -0.7],
            [-1.4, 0.75, 0.7],
            [1.4, 0.75, 0.7]
        ]

        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, this.materials.wood)
            leg.position.set(...pos)
            leg.castShadow = true
            table.add(leg)
        })

        table.position.set(2, 0, -2)
        this.furniture.group.add(table)
    }

    createChair()
    {
        const chair = new THREE.Group()

        // Seat
        const seatGeometry = new THREE.BoxGeometry(1, 0.1, 1)
        const seatMesh = new THREE.Mesh(seatGeometry, this.materials.wood)
        seatMesh.position.y = 1
        seatMesh.castShadow = true
        seatMesh.receiveShadow = true
        chair.add(seatMesh)

        // Backrest
        const backGeometry = new THREE.BoxGeometry(1, 1.5, 0.1)
        const backMesh = new THREE.Mesh(backGeometry, this.materials.wood)
        backMesh.position.set(0, 1.75, -0.45)
        backMesh.castShadow = true
        chair.add(backMesh)

        // Chair legs
        const legGeometry = new THREE.BoxGeometry(0.08, 1, 0.08)
        const legPositions = [
            [-0.4, 0.5, -0.4],
            [0.4, 0.5, -0.4],
            [-0.4, 0.5, 0.4],
            [0.4, 0.5, 0.4]
        ]

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, this.materials.wood)
            leg.position.set(...pos)
            leg.castShadow = true
            chair.add(leg)
        })

        chair.position.set(2, 0, -0.5)
        this.furniture.group.add(chair)
    }

    createLamp()
    {
        const lamp = new THREE.Group()

        // Lamp base
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16)
        const baseMesh = new THREE.Mesh(baseGeometry, this.materials.metal)
        baseMesh.position.y = 0.05
        baseMesh.castShadow = true
        lamp.add(baseMesh)

        // Lamp pole
        const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8)
        const poleMesh = new THREE.Mesh(poleGeometry, this.materials.metal)
        poleMesh.position.y = 1.5
        poleMesh.castShadow = true
        lamp.add(poleMesh)

        // Lamp shade
        const shadeGeometry = new THREE.ConeGeometry(0.8, 1, 16, 1, true)
        const shadeMesh = new THREE.Mesh(shadeGeometry, this.materials.lampShade)
        shadeMesh.position.y = 3.5
        shadeMesh.castShadow = true
        shadeMesh.receiveShadow = true
        lamp.add(shadeMesh)

        // Lamp light
        this.lampLight = new THREE.PointLight('#FFE4B5', 1, 10, 2)
        this.lampLight.position.set(0, 3.2, 0)
        this.lampLight.castShadow = true
        this.lampLight.shadow.mapSize.width = 1024
        this.lampLight.shadow.mapSize.height = 1024
        lamp.add(this.lampLight)

        lamp.position.set(-3, 0, 2)
        this.furniture.group.add(lamp)

        // Store reference for debugging
        this.lamp = lamp
    }

    createBookshelf()
    {
        const bookshelf = new THREE.Group()

        // Main frame
        const frameGeometry = new THREE.BoxGeometry(2, 4, 0.3)
        const frameMesh = new THREE.Mesh(frameGeometry, this.materials.wood)
        frameMesh.position.y = 2
        frameMesh.castShadow = true
        frameMesh.receiveShadow = true
        bookshelf.add(frameMesh)

        // Shelves
        const shelfGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.25)
        for(let i = 0; i < 4; i++) {
            const shelf = new THREE.Mesh(shelfGeometry, this.materials.wood)
            shelf.position.set(0, 0.5 + i * 0.8, 0)
            shelf.castShadow = true
            shelf.receiveShadow = true
            bookshelf.add(shelf)
        }

        // Books
        const bookColors = ['#8B0000', '#006400', '#4B0082', '#FF8C00', '#2F4F4F']
        for(let shelf = 0; shelf < 4; shelf++) {
            for(let book = 0; book < 8; book++) {
                const bookGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.02)
                const bookMaterial = new THREE.MeshStandardMaterial({
                    color: bookColors[book % bookColors.length],
                    roughness: 0.8
                })
                const bookMesh = new THREE.Mesh(bookGeometry, bookMaterial)
                bookMesh.position.set(
                    -0.7 + book * 0.18,
                    0.8 + shelf * 0.8,
                    0.1
                )
                bookMesh.castShadow = true
                bookshelf.add(bookMesh)
            }
        }

        bookshelf.position.set(-9.8, 0, -5)
        bookshelf.rotation.y = Math.PI * 0.5
        this.furniture.group.add(bookshelf)
    }

    createPictureFrame()
    {
        const frame = new THREE.Group()

        // Frame border
        const frameGeometry = new THREE.BoxGeometry(1.5, 1, 0.05)
        const frameMesh = new THREE.Mesh(frameGeometry, this.materials.wood)
        frameMesh.castShadow = true
        frame.add(frameMesh)

        // Picture (glass)
        const pictureGeometry = new THREE.BoxGeometry(1.3, 0.8, 0.02)
        const pictureMesh = new THREE.Mesh(pictureGeometry, this.materials.glass)
        pictureMesh.position.z = 0.02
        frame.add(pictureMesh)

        frame.position.set(0, 6, -9.9)
        this.furniture.group.add(frame)
    }

    createSofa()
    {
        const sofa = new THREE.Group()

        // Sofa base
        const baseGeometry = new THREE.BoxGeometry(3, 0.8, 1.5)
        const baseMesh = new THREE.Mesh(baseGeometry, this.materials.fabric)
        baseMesh.position.y = 0.4
        baseMesh.castShadow = true
        baseMesh.receiveShadow = true
        sofa.add(baseMesh)

        // Sofa back
        const backGeometry = new THREE.BoxGeometry(3, 1.5, 0.3)
        const backMesh = new THREE.Mesh(backGeometry, this.materials.fabric)
        backMesh.position.set(0, 1.35, -0.6)
        backMesh.castShadow = true
        sofa.add(backMesh)

        // Sofa arms
        const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 1.5)
        const leftArm = new THREE.Mesh(armGeometry, this.materials.fabric)
        leftArm.position.set(-1.35, 1.2, 0)
        leftArm.castShadow = true
        sofa.add(leftArm)

        const rightArm = new THREE.Mesh(armGeometry, this.materials.fabric)
        rightArm.position.set(1.35, 1.2, 0)
        rightArm.castShadow = true
        sofa.add(rightArm)

        // Cushions
        const cushionGeometry = new THREE.BoxGeometry(0.8, 0.3, 1.2)
        for(let i = 0; i < 3; i++) {
            const cushion = new THREE.Mesh(cushionGeometry, this.materials.fabric)
            cushion.position.set(-1 + i * 1, 0.95, 0)
            cushion.castShadow = true
            cushion.receiveShadow = true
            sofa.add(cushion)
        }

        sofa.position.set(-5, 0, 3)
        this.furniture.group.add(sofa)
    }

    update()
    {
        // Add any animation logic here if needed
    }

    destroy()
    {
        // Cleanup
    }
}