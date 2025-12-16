import React, { useEffect, useRef, useState } from 'react'

export default function Notification() {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  useEffect(() => {
    // convert a realtime activity into a toast
    const onRealtime = (e) => {
      const detail = e?.detail || e || {};
      const t = (detail.type || detail.event || '').toString();
      const product = detail.product || detail.productName || detail.name || '';
      if (t === 'stock-out' || detail?.status === 'low-stock' || t === 'low-stock') {
        pushToast('warning', `${product || 'Item'} is low or out of stock` , 6000)
      } else if (t === 'stock-in') {
        pushToast('success', `${product || 'Item'} stocked in (${detail.quantity || ''})`, 3500)
      } else if (t === 'product-added') {
        pushToast('success', `${product || 'Item'} added to catalog`, 3500)
      } else {
        // generic activity
        pushToast('info', detail?.message || `Activity: ${t || 'event'}`, 3000)
      }
    }

    const onNotify = (e) => {
      const { type = 'info', message = '' } = e.detail || {}
      pushToast(type, message, 3000)
    }

    window.addEventListener('realtime-activity', onRealtime)
    window.addEventListener('notify', onNotify)

    // helper for manual testing
    window.simulateRealtimeEvent = (detail) => window.dispatchEvent(new CustomEvent('realtime-activity', { detail }))
    window.simulateNotify = (detail) => window.dispatchEvent(new CustomEvent('notify', { detail }))

    return () => {
      window.removeEventListener('realtime-activity', onRealtime)
      window.removeEventListener('notify', onNotify)
      try { delete window.simulateRealtimeEvent } catch (e) {}
      try { delete window.simulateNotify } catch (e) {}
      // clear timers
      Object.values(timersRef.current || {}).forEach(id => clearTimeout(id))
      timersRef.current = {}
    }
  }, [])

  const pushToast = (type, message, timeout = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, message }])
    const tid = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
      delete timersRef.current[id]
    }, timeout)
    timersRef.current[id] = tid
  }

  const removeToast = (id) => {
    setToasts(t => t.filter(x => x.id !== id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }

  const pauseToast = (id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }

  const resumeToast = (id, remaining = 3000) => {
    if (!timersRef.current[id]) {
      timersRef.current[id] = setTimeout(() => removeToast(id), remaining)
    }
  }

  const classForType = (type) => {
    switch(type) {
      case 'error': return 'bg-red-50 border-l-4 border-red-500 text-red-800'
      case 'warning': return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800'
      case 'success': return 'bg-green-50 border-l-4 border-green-500 text-green-800'
      default: return 'bg-gray-800 text-white'
    }
  }

  return (
    <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onMouseEnter={() => pauseToast(t.id)}
          onMouseLeave={() => resumeToast(t.id, 3000)}
          className={`mb-3 max-w-sm px-4 py-3 rounded shadow-md transition-flex ${classForType(t.type)}`}
        >
          <div className="flex items-start gap-3">
            <div className="text-lg">
              {t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : t.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div className="flex-1 text-sm">
              {t.message}
            </div>
            <button onClick={() => removeToast(t.id)} className="ml-2 text-sm opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
