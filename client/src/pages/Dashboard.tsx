import React, { useEffect, useMemo, useState } from 'react'
import StatCard from '@components/StatCard'
import { getJson } from '@api/http'
import { Link } from 'react-router-dom'

type QueuesResponse = { queues: string[] }
type QueueAttrResponse = { attributes?: Record<string, string> }
type TopicsResponse = { topics: string[] }

export default function Dashboard() {
  const [queues, setQueues] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [queueDetails, setQueueDetails] = useState<{name:string;available:number;inflight:number;total:number}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const id = setInterval(loadData, 30000)
    return () => clearInterval(id)
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const sqs = await getJson<QueuesResponse>('/api/queues')
      const sns = await getJson<TopicsResponse>('/api/sns')
      setQueues(sqs.queues || [])
      setTopics(sns.topics || [])

      const details: {name:string;available:number;inflight:number;total:number}[] = []
      for (const url of sqs.queues || []) {
        try {
          const data = await getJson<QueueAttrResponse>(`/api/queue?url=${encodeURIComponent(url)}`)
          const available = parseInt(data.attributes?.ApproximateNumberOfMessages || '0')
          const inflight = parseInt(data.attributes?.ApproximateNumberOfMessagesNotVisible || '0')
          const total = available + inflight
          details.push({ name: url.split('/').pop() || url, available, inflight, total })
        } catch {}
      }
      setQueueDetails(details)
    } finally {
      setLoading(false)
    }
  }

  const totalMessages = useMemo(() => queueDetails.reduce((s, q) => s + q.total, 0), [queueDetails])
  const busiest = useMemo(() => queueDetails.reduce((m, q) => q.total > m.total ? q : m, {name:'None', available:0, inflight:0, total:0}), [queueDetails])
  const topQueues = useMemo(() => [...queueDetails].sort((a,b)=>b.total-a.total).slice(0,5), [queueDetails])

  return (
    <div className="dashboard" style={{maxWidth:1200, margin:'0 auto', padding:20}}>
      <div style={{marginBottom:30}}>
        <h1 style={{fontSize:28, fontWeight:700, color:'#1e293b', marginBottom:8}}>Dashboard</h1>
        <p style={{color:'#64748b'}}>Overview of your LocalStack services</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:20, marginBottom:30}}>
        <StatCard title="Total Queues" icon="📋" value={queues.length} description="Active SQS queues" />
        <StatCard title="Total Topics" icon="📢" value={topics.length} description="Active SNS topics" />
        <StatCard title="Total Messages" icon="💬" value={totalMessages} description="Messages across all queues" />
        <StatCard title="Busiest Queue" icon="🔥" value={<AutoSizeText text={busiest.name} />} description="Queue with most messages" />
      </div>

      <div style={{background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.1)', border:'1px solid #e2e8f0'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
          <h2 style={{fontSize:20, fontWeight:600, color:'#1e293b'}}>Queues with Most Messages</h2>
          <Link to="/sqs" style={{color:'#2563eb', textDecoration:'none'}}>View All Queues →</Link>
        </div>
        {loading ? (
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:40, color:'#64748b'}}>
            <div style={{border:'2px solid #e2e8f0', borderTop:'2px solid #2563eb', borderRadius:'50%', width:20, height:20, animation:'spin 1s linear infinite', marginRight:8}} />
            Loading queues...
          </div>
        ) : topQueues.length === 0 ? (
          <div style={{textAlign:'center', padding:40, color:'#64748b'}}>
            <div style={{fontSize:48, marginBottom:16, opacity:0.5}}>📭</div>
            <p>No queues found</p>
          </div>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={th}>Queue Name</th>
                <th style={th}>Available</th>
                <th style={th}>In Flight</th>
                <th style={th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {topQueues.map(q => (
                <tr key={q.name} style={{borderBottom:'1px solid #f1f5f9'}}>
                  <td style={tdName}>{q.name}</td>
                  <td style={td}>{q.available}</td>
                  <td style={td}>{q.inflight}</td>
                  <td style={{...td, fontWeight:600, color: countColor(q.total)}}>{q.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function AutoSizeText({ text }: { text: string }) {
  const className = text.length > 20 ? {fontSize:20} : text.length > 12 ? {fontSize:24} : {fontSize:32}
  return <span style={{fontWeight:700, color:'#1e293b', ...className}}>{text}</span>
}

const th: React.CSSProperties = { textAlign:'left', padding:'12px 16px', fontSize:12, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid #e2e8f0' }
const td: React.CSSProperties = { padding:16, fontSize:14 }
const tdName: React.CSSProperties = { ...td, fontWeight:600, color:'#1e293b' }

function countColor(total: number) {
  if (total === 0) return '#059669'
  if (total <= 10) return '#d97706'
  return '#dc2626'
}

