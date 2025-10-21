import React, { useEffect, useMemo, useState } from 'react'
import ResizableSidebar from '@components/ResizableSidebar'
import Modal from '@components/Modal'
import useToast from '@components/Toast'
import { getJson, postJson } from '@api/http'

type QueuesResponse = { queues: string[] }
type QueueDetail = { attributes?: Record<string, string> }

const WRITABLE = [
  'DelaySeconds','MaximumMessageSize','MessageRetentionPeriod','Policy','ReceiveMessageWaitTimeSeconds','RedrivePolicy','VisibilityTimeout','KmsMasterKeyId','KmsDataKeyReusePeriodSeconds','ContentBasedDeduplication','FifoThroughputLimit','DeduplicationScope','RedriveAllowPolicy','SqsManagedSseEnabled'
]

export default function Sqs() {
  const [allQueues, setAllQueues] = useState<string[]>([])
  const [filter, setFilter] = useState<string>(() => localStorage.getItem('sqs_filter') || '')
  const [selectedUrl, setSelectedUrl] = useState<string | null>(() => localStorage.getItem('sqs_selected_queue'))
  const [details, setDetails] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)
  const [counts, setCounts] = useState<Record<string, {avail:number|string, inflight:number|string}>>({})
  const [sendOpen, setSendOpen] = useState(false)
  const [peekOpen, setPeekOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [groupId, setGroupId] = useState('')
  const [dedupId, setDedupId] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const { setToast, Toast } = useToast()

  useEffect(() => { loadQueues() }, [])
  useEffect(() => { const id = setInterval(loadQueues, 30000); return () => clearInterval(id) }, [])

  const filteredQueues = useMemo(() => allQueues.filter(u => u.toLowerCase().includes(filter.toLowerCase())), [allQueues, filter])
  const isFifo = selectedUrl?.endsWith('.fifo')
  const dedupEnabled = details['ContentBasedDeduplication'] === 'true'

  async function loadQueues() {
    try {
      const res = await getJson<QueuesResponse>('/api/queues')
      setAllQueues(res.queues || [])
      setCounts({})
      ;(res.queues || []).forEach(async (url) => {
        try {
          const d = await getJson<QueueDetail>(`/api/queue?url=${encodeURIComponent(url)}`)
          const avail = d.attributes?.ApproximateNumberOfMessages ?? '-'
          const inflight = d.attributes?.ApproximateNumberOfMessagesNotVisible ?? '-'
          setCounts(prev => ({...prev, [url]: { avail: Number.isNaN(+avail) ? '-' : +avail, inflight: Number.isNaN(+inflight) ? '-' : +inflight }}))
        } catch {}
      })
      const saved = localStorage.getItem('sqs_selected_queue')
      if (saved && (res.queues || []).includes(saved)) {
        if (selectedUrl !== saved) await loadAttributes(saved)
      }
    } catch {}
  }

  async function loadAttributes(url: string) {
    const data = await getJson<QueueDetail>(`/api/queue?url=${encodeURIComponent(url)}`)
    setSelectedUrl(url)
    localStorage.setItem('sqs_selected_queue', url)
    setEditing(false)
    setDetails(data.attributes || {})
  }

  function enterEdit() { if (selectedUrl && !editing) setEditing(true) }
  function cancelEdit() { if (selectedUrl) loadAttributes(selectedUrl) }

  async function saveEdit() {
    if (!selectedUrl || !editing) return
    const attributes: Record<string,string> = {}
    Object.entries(details).forEach(([k, v]) => { if (WRITABLE.includes(k)) attributes[k] = String(v ?? '') })
    await postJson('/api/queue/attributes', { url: selectedUrl, attributes })
    setToast('Attributes updated successfully')
    await loadAttributes(selectedUrl)
  }

  async function sendMessage() {
    if (!selectedUrl) return
    const needsDedup = !!isFifo && !dedupEnabled
    const body: any = { url: selectedUrl, message }
    if (isFifo) body.messageGroupId = groupId
    if (needsDedup) body.messageDeduplicationId = dedupId || `dedup-${Date.now()}-${Math.random().toString(36).slice(2,10)}`
    await postJson('/api/queue/send', body)
    setSendOpen(false)
    setMessage(''); setGroupId(''); setDedupId('')
    setToast('Message sent!')
    if (selectedUrl) await loadAttributes(selectedUrl)
  }

  async function fetchPeekMessages() {
    if (!selectedUrl) return
    const res = await postJson<{messages:any[]}>('/api/queue/messages', { url: selectedUrl })
    setMessages(res.messages || [])
  }

  async function purgeQueue() {
    if (!selectedUrl) return
    await postJson('/api/queue/purge', { url: selectedUrl })
    setToast('Queue purged!')
    await loadAttributes(selectedUrl)
  }

  return (
    <div style={{display:'flex', height:'calc(100vh - 60px)'}}>
      <ResizableSidebar
        header={
          <div>
            <h2 style={{padding:10, margin:0}}>Queues</h2>
            <input
              value={filter}
              onChange={e => { setFilter(e.target.value); localStorage.setItem('sqs_filter', e.target.value) }}
              placeholder="Search..."
              style={{width:'90%', margin:10, padding:6, border:'1px solid #cbd5e1', borderRadius:6}}
            />
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, fontWeight:600, padding:'6px 12px 4px 12px', color:'#475569', margin:'4px 6px 0 6px', borderBottom:'1px solid #e2e8f0'}}>
              <span>Queue</span>
              <span>Avail / Inflight</span>
            </div>
          </div>
        }
      >
        <div>
          {filteredQueues.map(url => {
            const name = url.split('/').pop() || url
            const c = counts[url]
            const badge = c ? `${c.avail ?? '-'} / ${c.inflight ?? '-'}` : '-'
            const active = url === selectedUrl
            return (
              <div key={url} onClick={()=>loadAttributes(url)} title={url} style={{padding:'10px 12px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', margin:'4px 6px', borderRadius:6, transition:'background .15s, color .15s', background: active ? '#2563eb' : undefined, color: active ? '#fff': undefined}}>
                <span>{name}</span>
                <span style={{background: active ? 'rgba(255,255,255,0.3)' : '#e5e7eb', borderRadius:12, padding:'2px 8px', fontSize:12, minWidth:36, textAlign:'center'}}>{badge}</span>
              </div>
            )
          })}
        </div>
      </ResizableSidebar>
      <div style={{flex:1, padding:20, overflowY:'auto'}}>
        {!selectedUrl ? (
          <div>Select a queue to view its attributes</div>
        ) : (
          <>
            <h2 style={{margin:'0 0 10px 0'}}>{selectedUrl.split('/').pop()}</h2>
            <hr style={{border:'none', borderTop:'2px solid #e5e7eb', margin:'0 0 18px 0'}} />
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, gap:12}}>
              <div style={{display:'flex', gap:10}}>
                <span className="stat-card">Available: {details['ApproximateNumberOfMessages'] ?? '-'}</span>
                <span className="stat-card">In flight: {details['ApproximateNumberOfMessagesNotVisible'] ?? '-'}</span>
              </div>
              <div style={{display:'flex', gap:8}}>
                {!editing && <button onClick={enterEdit} className="action-btn primary">Edit</button>}
                {editing && (
                  <>
                    <button onClick={saveEdit} className="action-btn primary">Save</button>
                    <button onClick={cancelEdit} className="action-btn secondary">Cancel</button>
                  </>
                )}
                <button onClick={()=>{ setSendOpen(true); setMessage(''); setGroupId(''); setDedupId('') }} className="action-btn primary">Send Message</button>
                <button onClick={()=>{ setPeekOpen(true); fetchPeekMessages() }} className="action-btn secondary">View Messages</button>
                <button onClick={purgeQueue} className="action-btn danger">Purge Queue</button>
              </div>
            </div>
            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, background:'#fff', borderRadius:8, overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
              <thead>
                <tr>
                  <th style={{background:'#f3f4f6', textAlign:'left', fontWeight:600, padding:'12px 16px'}}>Attribute</th>
                  <th style={{background:'#f3f4f6', textAlign:'left', fontWeight:600, padding:'12px 16px'}}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(details).map(([k,v]) => (
                  <tr key={k}>
                    <td style={{padding:'12px 16px'}}>{k}</td>
                    <td style={{padding:'12px 16px', background: WRITABLE.includes(k) ? undefined : '#f9f9f9'}}>
                      {editing && WRITABLE.includes(k) ? (
                        <input value={String(v)} onChange={e=> setDetails(d=> ({...d, [k]: e.target.value}))} style={{width:'100%'}} />
                      ) : (
                        String(v)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <Modal open={sendOpen} onClose={()=>setSendOpen(false)} title="Send Message" footer={
        <>
          <button onClick={()=>setSendOpen(false)} className="action-btn secondary">Cancel</button>
          <button onClick={sendMessage} className="action-btn primary">Send</button>
        </>
      }>
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          <textarea rows={6} value={message} onChange={e=>setMessage(e.target.value)} style={{width:'100%', resize:'vertical', fontSize:15, padding:8}} />
          {isFifo && (
            <div style={{display:'flex', flexDirection:'column', gap:4}}>
              <label style={{fontSize:14}}>Message Group ID <span style={{color:'#e11d48'}}>*</span></label>
              <input value={groupId} onChange={e=>setGroupId(e.target.value)} style={{width:'100%', fontSize:15, padding:6, borderRadius:6, border:'1px solid #cbd5e1'}} />
            </div>
          )}
          {isFifo && !dedupEnabled && (
            <div style={{display:'flex', flexDirection:'column', gap:4}}>
              <label style={{fontSize:14}}>Message Deduplication ID <span style={{color:'#e11d48'}}>*</span></label>
              <input value={dedupId} onChange={e=>setDedupId(e.target.value)} style={{width:'100%', fontSize:15, padding:6, borderRadius:6, border:'1px solid #cbd5e1'}} placeholder="Leave blank to auto-generate" />
            </div>
          )}
        </div>
      </Modal>

      <Modal open={peekOpen} onClose={()=>setPeekOpen(false)} title="Peek Messages" footer={
        <>
          <button onClick={()=>fetchPeekMessages()} className="action-btn secondary">Refresh</button>
          <button onClick={()=>setPeekOpen(false)} className="action-btn secondary">Close</button>
        </>
      }>
        <div style={{fontSize:15, maxHeight:'50vh', overflow:'auto'}}>
          {messages.length === 0 ? <div style={{color:'#888'}}>No messages found.</div> : messages.map((m,i) => (
            <div key={m?.messageId || i} style={{marginBottom:18, padding:12, borderRadius:8, background:'#f3f4f6'}}>
              <div style={{fontSize:13, color:'#666', marginBottom:4}}>#{i+1} | <b>MessageId:</b> {m.messageId}</div>
              <div style={{whiteSpace:'pre-wrap', wordBreak:'break-all', marginBottom:6}}><b>Body:</b><br/>{m.body}</div>
              <details style={{fontSize:13, color:'#444'}}>
                <summary>Show metadata</summary>
                <pre style={{background:'#eee', padding:8, borderRadius:6}}>{JSON.stringify(m, null, 2)}</pre>
              </details>
            </div>
          ))}
        </div>
      </Modal>

      <Toast />
    </div>
  )
}

