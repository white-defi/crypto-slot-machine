import { useEffect, useState } from "react"

export default function useTimer(options) {
  const {
    callback,
    delay
  } = options


  
  const [ isInited, setIsInited ] = useState(false)
  const [ isActive, setIsActive ] = useState(false)

  const _ticker = () => {
    callback()
  }

  useEffect(() => {
    if (!isInited) {
      console.log('>>> INIT TIMER')
      const timeout = window.setInterval(() => {
        console.log('>>> FIRE', isActive)
        if (isActive) callback()
      }, delay)

      return () => {
        window.clearInterval(timeout)
      }
      setIsInited(true)
    }
  }, [ isInited ])
  
  return [
    isActive,
    setIsActive,
    () => {
      callback()
    }
  ]
}