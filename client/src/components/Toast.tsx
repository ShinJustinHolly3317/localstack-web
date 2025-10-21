import React, { useEffect, useState } from 'react'

export default function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    if (!message) return
    const id = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(id)
  }, [message])

  const Toast = () => (
    <div style={{position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background:'#4caf50', color:'#fff', padding:'10px 20px', borderRadius:4, display: message ? 'block':'none', zIndex:1100}}>
      {message}
    </div>
  )

  return { setToast: setMessage, Toast }
}

