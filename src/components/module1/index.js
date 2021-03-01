import { useState, useRef } from 'react'
import Main from './main'

import bg from './asset/bg.jpg'

import styles from './module1.module.scss'

export default function Module1 () {

    const [init, setInit] = useState(false)
    const [name, setName] = useState('')

    const input = useRef()

    const process = () => {
        setInit(true)
    }

    return <div>
        {
            !init
            ? <><div className={styles.intro}>
                <input onChange={e => setName(e.target.value)}ref={input} className={styles.input} placeholder='Name' maxLength='12'/>
                <div onClick={() => process()} className={styles.submit}>&#x2192;</div>
            </div>
            <img src={bg} className={styles.bg} />
            </>
            : <Main name={name}/>
        }
    </div>
}