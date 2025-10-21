import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: Props) {
  if (!open) return null
  return (
    <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.2)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'#fff', padding:'24px 28px', borderRadius:10, minWidth:320, maxWidth:'90vw', boxShadow:'0 2px 16px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column', gap:16}}>
        {title ? <h3 style={{margin:0}}>{title}</h3> : null}
        <div>{children}</div>
        <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
          {footer}
        </div>
        <button style={{position:'absolute', top:8, right:8, background:'transparent', border:'none', cursor:'pointer'}} aria-label="Close" onClick={onClose}>✖️</button>
      </div>
    </div>
  )
}

