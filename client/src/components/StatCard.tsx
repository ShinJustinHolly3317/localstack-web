import React from 'react'

type Props = {
  title: string
  icon?: string
  value: React.ReactNode
  description?: string
}

export default function StatCard({ title, icon, value, description }: Props) {
  return (
    <div style={{background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.1)', border:'1px solid #e2e8f0'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
        <span style={{fontSize:14, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:0.5}}>{title}</span>
        {icon ? <span style={{fontSize:20, color:'#2563eb'}}>{icon}</span> : null}
      </div>
      <div style={{fontSize:32, fontWeight:700, color:'#1e293b', marginBottom:8, lineHeight:1.2}}>{value}</div>
      {description ? <div style={{fontSize:14, color:'#64748b'}}>{description}</div> : null}
    </div>
  )
}

