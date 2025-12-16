import React, { useState, useEffect } from 'react';

const levelToStyle = {
  critical: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-800', emoji: '🚨' },
  warning: { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800', emoji: '⚠️' },
  info: { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-800', emoji: '👤' }
};

const SystemAlerts = ({ alerts }) => {
  const [list, setList] = useState(alerts || []);

  useEffect(() => {
    if (!alerts) {
      const onRealtime = (e) => {
        try {
          const d = e?.detail || e || {};
          const t = (d.type || d.level || '').toString();
          if (t) setList(prev => [{ id: Date.now(), level: t === 'low-stock' || t === 'stock-out' ? 'critical' : t === 'stock-in' ? 'info' : 'warning', title: d.product || d.title || 'Realtime Alert', message: d.message || '' }, ...prev].slice(0, 6));
        } catch (err) { console.debug('[SystemAlerts] realtime error', err); }
      };
      window.addEventListener('realtime-activity', onRealtime);
      return () => window.removeEventListener('realtime-activity', onRealtime);
    }
  }, [alerts]);

  return (
    <div className="bg-white shadow-md rounded-lg p-5 transform hover:-translate-y-0.5 hover:shadow-lg transition">
      <h2 className="text-base font-semibold mb-3">System Alerts</h2>
      {(!list || list.length === 0) ? (
        <div className="text-sm text-gray-600">No system alerts.</div>
      ) : (
        <div className="space-y-3">
          {list.map(a => {
            const lvl = levelToStyle[a.level] || levelToStyle.info;
            return (
              <div key={a.id} className={`flex items-start p-3 rounded ${lvl.bg} hover:shadow-sm transition`}>
                <div className="text-xl mr-3">{lvl.emoji}</div>
                <div>
                  <div className={`font-medium ${lvl.text}`}>{a.title}</div>
                  <div className={`text-sm text-gray-600`}>{a.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SystemAlerts;
