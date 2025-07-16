import Experience from './Experience.js'
import SimpleRoom from './SimpleRoom.js'
import Lighting from './Lighting.js'
import Furniture from './Furniture.js'

export default class World
{
    constructor(_options)
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        
        this.setRoom()
        this.setLighting()
        this.setFurniture()
    }

    setRoom()
    {
        this.room = new SimpleRoom()
    }

    setLighting()
    {
        this.lighting = new Lighting()
    }

    setFurniture()
    {
        this.furniture = new Furniture()
    }

    resize()
    {
    }

    update()
    {
        if(this.furniture)
            this.furniture.update()
    }

    destroy()
    {
    }
}