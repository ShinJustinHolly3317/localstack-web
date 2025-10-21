import React, { useEffect, useRef, useState } from 'react'

type Props = {
  width?: number
  min?: number
  max?: number
  header?: React.ReactNode
  children?: React.ReactNode
}

export default function ResizableSidebar({ width = 350, min = 180, max = 600, header, children }: Props) {
  const [sidebarWidth, setSidebarWidth] = useState(width)
  const startXRef = useRef(0)
  const startWRef = useRef(0)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const w = Math.min(max, Math.max(min, startWRef.current + (e.clientX - startXRef.current)))
      setSidebarWidth(w)
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.userSelect = ''
    }
    function onMouseDown(e: MouseEvent) {
      startXRef.current = e.clientX
      startWRef.current = sidebarWidth
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }
    const resizer = document.getElementById('sidebar-resizer')
    resizer?.addEventListener('mousedown', onMouseDown as any)
    return () => resizer?.removeEventListener('mousedown', onMouseDown as any)
  }, [sidebarWidth, min, max])

  return (
    <>
      <div style={{position:'relative', width: sidebarWidth, minWidth:min, maxWidth:max, background:'#f8fafc', overflow:'auto', borderRight:'1px solid #e2e8f0', boxShadow:'2px 0 4px rgba(0,0,0,0.05)'}}>
        {header}
        {children}
      </div>
      <div id="sidebar-resizer" style={{width:5, cursor:'col-resize', background:'transparent'}} />
    </>
  )
}

