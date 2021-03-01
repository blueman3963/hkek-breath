 /* eslint-disable */ 
import styles from './module1.module.scss'

import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import * as PIXI from 'pixi.js'

import tex01 from './asset/01.png'
import tex02 from './asset/02.png'
import tex03 from './asset/03.png'
import tex04 from './asset/04.png'
import tex05 from './asset/05.png'
import tex06 from './asset/06.png'
import tex07 from './asset/07.png'
import tex08 from './asset/08.png'
import tex09 from './asset/09.png'
import tex10 from './asset/10.png'
import noise from './asset/noise.png'


const tex = [tex01, tex02, tex03, tex04, tex05, tex06, tex07, tex08, tex09, tex10]

const server = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development')
    ? 'https://hkek-breath.herokuapp.com'//'http://192.168.1.175:8888'
    : 'https://hkek-breath.herokuapp.com'

const socket = io(server,{transports: ['websocket'], upgrade: false});

export default function Main (props) {

    const {
        name
    } = props

    const id = useRef(null)

    const [app, setApp] = useState(null)

    const users = useRef({})
    const canvas = useRef()
    const target = useRef([.5,.5])
    const pos = useRef([.5,.5])
    const [holding,setHolding] = useState(false)
    const [pressing,setPressing] = useState(false)

    const progressing = useRef(false)
    const progress = useRef(0)

    const mainRef = useRef()

    useEffect(() => {
        const app = new PIXI.Application()
        setApp(app)
        canvas.current.appendChild(app.view)

        app.renderer.autoResize = true
        app.renderer.backgroundColor = 0xffffff;

        let main = new PIXI.Container()
        main.sortableChildren = true
        mainRef.current = main
        app.stage.addChild(main)

        window.addEventListener('resize', handleResize)
        function handleResize () {
            app.renderer.resize(window.innerWidth, window.innerHeight)
        }
        handleResize()

        //filter
        const displacementSprite = PIXI.Sprite.from(noise)
        displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT
        const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite, 30)
        displacementSprite.scale.y = .4
	    displacementSprite.scale.x = .4
	    app.stage.addChild(displacementSprite)

        let count = 0

        app.ticker.add(() => {
            displacementSprite.x = count*10
	        displacementSprite.y = count*10
	        count += 0.05
            mainRef.current.filters = [displacementFilter]
        })

        return () => {
            window.removeEventListener('resize', handleResize)
        }

    },[])

    useEffect(() => {
        if(!app) return
        //init
        let colorId = Math.floor(Math.random()*tex.length)
        socket.emit('handshake', {
            name: name,
            color: colorId
        })
        //get current users
        socket.on('handshake', data => {
            //set self
            id.current = data.client.id
            //add current users
            Object.keys(data.users).forEach(id => {
                const user = data.users[id]
                users.current[id] = user
                addNewUser(user)
            })
        })


        document.addEventListener('mousemove', handleCursor)
        document.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('keyup', handleKeyUp)
        document.addEventListener('touchstart', handleTouchStart)
        document.addEventListener('touchend', handleTouchEnd)

        setInterval(() => {

            pos.current = [
                pos.current[0] + (target.current[0] - pos.current[0])/50,
                pos.current[1] + (target.current[1] - pos.current[1])/50,
            ]

            socket.emit('updatePos', {
                x: pos.current[0],
                y: pos.current[1],
                z: progress.current,
            })

            calculateProgress()

        },20)

        const handleBroadcast = (data) => {
            
            const type = data.type

            switch(type) {
                case 'location':
                    renderUsers(data)
                    break
                case 'newClient':
                    if(data.user.id === id) return
                    users.current[data.user.id] = data.user
                    addNewUser(data.user)
                    break
                case 'kill':
                    if (!users.current[data.userId]) return
                    users.current[data.userId].sprite.parent.removeChild(users.current[data.userId].sprite)
                    users.current[data.userId].text.parent.removeChild(users.current[data.userId].text)
                    delete users[data.userId]
                    break;
                default:
                    return
            }
        }

        socket.on('broadcast', handleBroadcast)

        const addNewUser = (user) => {
            if(!app) return

            let testTexture = PIXI.Texture.from(tex[user.color])
            let sprite = new PIXI.Sprite(testTexture)
            sprite.anchor.set(0.5)
            sprite.scale.set(0.1)
            sprite.x = app.screen.width/2
            sprite.y = app.screen.height/2
            sprite.zIndex = user.id === id.current ? 99 : 1
            sprite.blendMode = PIXI.BLEND_MODES.ADD;
            mainRef.current.addChild(sprite)
            users.current[user.id].sprite = sprite

            let text = new PIXI.Text(user.name,{fontFamily : 'Arial', fontSize: 20, fill : 0x333333, align : 'center'});
            text.anchor.set(0, 1.2)
            app.stage.addChild(text)
            users.current[user.id].text = text        
        }

        return () => {
            document.removeEventListener('mousemove', handleCursor)
            document.removeEventListener('mousedown', handleMouseDown) 
            document.removeEventListener('mouseup', handleMouseUp) 
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('keyup', handleKeyUp)
        }
        

    },[app])

    useEffect(() => {
        progressing.current = holding||pressing
    },[holding, pressing])

    const handleKeyDown = (e) => {
        if(e.keyCode === 32) setPressing(true)
    }

    const handleKeyUp = (e) => {
        if(e.keyCode === 32) setPressing(false)
    }

    const calculateProgress = () => {
        console.log(progressing.current)
        progress.current += progressing.current ? (100 - progress.current)/100 : (0-progress.current)/100
        progress.current = Math.max(Math.min(progress.current, 100),0)
    }

    const handleCursor = (e) => {
        target.current = [e.clientX/window.innerWidth,e.clientY/window.innerHeight]
    }

    const handleMouseDown = () => {
        setHolding(true)
    }

    const handleMouseUp = () => {
        setHolding(false)
    }

    const handleTouchEnd = () => {
        setHolding(false)
    }

    const handleTouchStart = (e) => {
        setHolding(true)
        target.current = [e.clientX/window.innerWidth,e.clientY/window.innerHeight]
    }

    const renderUsers = ({data:data}) => {
        if(!app) return
        
        Object.keys(data).forEach(key => {
            let user = users.current[key]
            let userData = data[key].data

            if(key === id || !user) return

            user.sprite.x = app.screen.width * userData.x
            user.sprite.y = app.screen.height * userData.y
            user.sprite.scale.set(0.2 + 2*(userData.z/100))
            user.sprite.alpha = 1 - 0.8*(userData.z/100)

            user.text.x = app.screen.width * userData.x
            user.text.y = app.screen.height * userData.y
            
        }) 

    }

    return <div ref={canvas} className={styles.canvas}>
        <div className={styles.instruction}>
            {
                !(pressing||holding)
                ?'Press and hold your mouse or spacebar to inhale.'
                :'Release to exhale.'
            }
        </div>
    </div>
}