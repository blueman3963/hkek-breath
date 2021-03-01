import { useState, useRef, useEffect } from 'react'
import Main from './main'

import styles from './module1.module.scss'

export default function () {

    const [init, setInit] = useState(false)
    const [name, setName] = useState('')

    const input = useRef()

    const process = () => {
        setInit(true)
    }

    return <div>
        {
            !init
            ? <div className={styles.intro}>
                <input onChange={e => setName(e.target.value)}ref={input} className={styles.input} placeholder='Name' maxLength='20'/>
                <div onClick={() => process()} className={styles.submit}>GO</div>
            </div>
            : <Main name={name} color='#333333'/>
        }
    </div>
}