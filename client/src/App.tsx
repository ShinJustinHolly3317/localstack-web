import { Link, NavLink, Route, Routes } from 'react-router-dom'
import RoutesConfig from './routes'

function Navbar() {
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,height:60,background:'#1e293b',color:'#fff',display:'flex',alignItems:'center',padding:'0 20px',zIndex:1000,boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>
      <div style={{fontSize:18,fontWeight:600,marginRight:40,display:'flex',alignItems:'center',gap:12}}>
        <Link to="/" style={{textDecoration:'none'}}>🏠</Link>
        LocalStack Explorer
      </div>
      <nav>
        <ul style={{display:'flex',listStyle:'none',margin:0,padding:0,gap:20}}>
          <li><NavLink to="/" end className={({isActive})=>`nav ${isActive?'active':''}`} style={linkStyle}>Dashboard</NavLink></li>
          <li><NavLink to="/sqs" className={({isActive})=>`nav ${isActive?'active':''}`} style={linkStyle}>SQS</NavLink></li>
          <li><NavLink to="/sns" className={({isActive})=>`nav ${isActive?'active':''}`} style={linkStyle}>SNS</NavLink></li>
        </ul>
      </nav>
    </div>
  )
}

const linkStyle: React.CSSProperties = { color:'#cbd5e1', textDecoration:'none', padding:'8px 16px', borderRadius:6 }

export default function App() {
  return (
    <div>
      <Navbar />
      <div style={{paddingTop:60}}>
        <Routes>
          {RoutesConfig}
        </Routes>
      </div>
    </div>
  )
}

