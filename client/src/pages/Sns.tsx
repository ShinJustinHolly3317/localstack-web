import React, { useEffect, useMemo, useState } from 'react'
import ResizableSidebar from '@components/ResizableSidebar'
import { getJson } from '@api/http'

type TopicsResponse = { topics: string[] }
type TopicAttrResponse = { attributes?: Record<string,string> }

export default function Sns() {
  const [allTopics, setAllTopics] = useState<string[]>([])
  const [filter, setFilter] = useState('')
  const [selectedArn, setSelectedArn] = useState<string | null>(null)
  const [attributes, setAttributes] = useState<Record<string,string>>({})
  const [sqsSubs, setSqsSubs] = useState<string[]>([])

  useEffect(()=>{ loadTopics() }, [])
  useEffect(()=>{ const id = setInterval(loadTopics, 30000); return ()=>clearInterval(id) }, [])

  async function loadTopics() {
    try {
      const res = await getJson<TopicsResponse>('/api/sns')
      setAllTopics(res.topics || [])
    } catch {}
  }

  const filtered = useMemo(()=> allTopics.filter(a => a.toLowerCase().includes(filter.toLowerCase())), [allTopics, filter])

  async function loadAttributes(arn: string) {
    try {
      const data = await getJson<TopicAttrResponse>(`/api/topic?arn=${encodeURIComponent(arn)}`)
      setAttributes(data.attributes || {})
      setSelectedArn(arn)
      try {
        const subs = await getJson<{sqs: {Endpoint:string}[]|undefined}>(`/api/topic-sqs-subs?arn=${encodeURIComponent(arn)}`)
        setSqsSubs((subs.sqs || []).map(s => s.Endpoint))
      } catch { setSqsSubs([]) }
    } catch {}
  }

  return (
    <div style={{display:'flex', height:'calc(100vh - 60px)'}}>
      <ResizableSidebar
        header={
          <div>
            <h2 style={{padding:10, margin:0}}>SNS Topics</h2>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search..." style={{width:'90%', margin:10, padding:6, border:'1px solid #cbd5e1', borderRadius:6}} />
            <div style={{fontSize:12, fontWeight:600, padding:'6px 12px 4px', color:'#475569', margin:'4px 6px 0', borderBottom:'1px solid #e2e8f0'}}>Topic Name</div>
          </div>
        }
      >
        <div>
          {filtered.map(arn => {
            const name = arn.split(':').pop() || arn
            const active = arn === selectedArn
            return (
              <div key={arn} onClick={()=>loadAttributes(arn)} title={arn} style={{padding:'10px 12px', cursor:'pointer', margin:'4px 6px', borderRadius:6, transition:'background .15s', background: active ? '#2563eb' : undefined, color: active ? '#fff' : undefined, fontWeight:500}}>
                {name}
              </div>
            )
          })}
        </div>
      </ResizableSidebar>
      <div style={{flex:1, padding:20, overflowY:'auto'}}>
        {!selectedArn ? (
          <div>Select a topic to view its attributes</div>
        ) : (
          <>
            <h2 style={{marginTop:0}}>{selectedArn.split(':').pop()}</h2>
            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, background:'#fff', borderRadius:8, overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
              <thead>
                <tr><th style={{background:'#f3f4f6', textAlign:'left', fontWeight:600, padding:'12px 16px'}}>Attribute</th><th style={{background:'#f3f4f6', textAlign:'left', fontWeight:600, padding:'12px 16px'}}>Value</th></tr>
              </thead>
              <tbody>
                {Object.entries(attributes).map(([k,v]) => (
                  <tr key={k}><td style={{padding:'12px 16px'}}>{k}</td><td style={{padding:'12px 16px'}}>{String(v)}</td></tr>
                ))}
              </tbody>
            </table>
            {sqsSubs.length > 0 && (
              <div style={{marginTop:24}}>
                <h3 style={{margin:'0 0 8px 0'}}>Subscribed SQS Queues</h3>
                <ul style={{paddingLeft:18, margin:0}}>
                  {sqsSubs.map(x => <li key={x}>{x}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

