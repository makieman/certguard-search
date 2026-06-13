import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

// ─── Helpers ────────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }) {
  const v = (verdict || '').toLowerCase();
  const isReady = v === 'ready';
  const isAbstain = v === 'abstain';

  const style = isReady
    ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.35)' }
    : isAbstain
    ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }
    : { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' };

  return (
    <span style={{
      ...style,
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'inline-block',
    }}>
      {verdict || 'unknown'}
    </span>
  );
}

function DonutRing({ value, total, color, label, sublabel }) {
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const pct = total > 0 ? value / total : 0;
  const offset = circ - pct * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: color }}>{value}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sublabel}</div>}
      </div>
    </div>
  );
}

function StatKpi({ value, label, color, icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: '14px',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/team-insights`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchInsights, 60_000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  // ── Render: Loading ──────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderTopColor: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading team insights…</p>
      </div>
    );
  }

  // ── Render: Error ────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div style={{
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: '14px', padding: '32px', textAlign: 'center',
      }}>
        <svg width="40" height="40" fill="none" stroke="#ef4444" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '12px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p style={{ color: '#ef4444', fontWeight: 600, margin: '0 0 8px' }}>Failed to load team insights</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px' }}>{error}</p>
        <button className="btn btn-secondary" onClick={fetchInsights}>Retry</button>
      </div>
    );
  }

  const total = data?.total_analyzed ?? 0;
  const ready = data?.ready ?? 0;
  const notReady = data?.not_ready ?? 0;
  const abstain = data?.abstain ?? 0;
  const passRate = data?.pass_rate ?? 0;
  const sessions = data?.recent_sessions ?? [];

  // ── Render: Dashboard ────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Header row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="card-title" style={{ margin: 0 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Manager Dashboard
          </h2>
          {lastRefreshed && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Last updated {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchInsights}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {loading ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--text-primary)' }} /> : (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <StatKpi
          value={total}
          label="Total Analyzed"
          color="var(--color-secondary)"
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
        />
        <StatKpi
          value={`${passRate}%`}
          label="Pass Rate"
          color="var(--color-primary)"
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
        />
        <StatKpi
          value={ready}
          label="Cert Ready"
          color="var(--color-success)"
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatKpi
          value={notReady}
          label="At Risk"
          color="var(--color-danger)"
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        />
        <StatKpi
          value={abstain}
          label="Abstained"
          color="var(--color-warning)"
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* ── Verdict Breakdown + Donut Charts ── */}
      {total > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ margin: '0 0 24px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Verdict Breakdown
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px' }}>
            <DonutRing value={ready} total={total} color="#10b981" label="Ready" sublabel={`${total > 0 ? Math.round(ready/total*100) : 0}% of cohort`} />
            <DonutRing value={notReady} total={total} color="#ef4444" label="Not Ready" sublabel={`${total > 0 ? Math.round(notReady/total*100) : 0}% of cohort`} />
            <DonutRing value={abstain} total={total} color="#f59e0b" label="Abstain" sublabel={`${total > 0 ? Math.round(abstain/total*100) : 0}% of cohort`} />
          </div>

          {/* Pass Rate Progress Bar */}
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Pass Rate</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: passRate >= 70 ? '#10b981' : passRate >= 40 ? '#f59e0b' : '#ef4444' }}>{passRate}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${passRate}%`,
                borderRadius: '100px',
                background: passRate >= 70
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : passRate >= 40
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #ef4444, #f87171)',
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: passRate >= 70 ? '0 0 8px rgba(16,185,129,0.5)' : passRate >= 40 ? '0 0 8px rgba(245,158,11,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Sessions Table ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recent Evaluations
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 8px' }}>
            Last {sessions.length}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            No evaluations yet. Run an assessment to see results here.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Learner', 'Certification', 'Verdict', 'Confidence', 'Date'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < sessions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0,
                          opacity: 0.8,
                        }}>
                          {(s.learner || '?')[0].toUpperCase()}
                        </div>
                        {s.learner}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '220px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {s.cert}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <VerdictBadge verdict={s.verdict} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.round((s.confidence || 0) * 100)}%`,
                            background: 'var(--color-primary)',
                            borderRadius: '100px',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {Math.round((s.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {s.created_at ? new Date(s.created_at + 'Z').toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Empty State nudge ── */}
      {total === 0 && (
        <div style={{
          background: 'rgba(168,85,247,0.05)',
          border: '1px dashed rgba(168,85,247,0.25)',
          borderRadius: '14px',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}>
          No evaluations have been run yet. Switch to the <strong style={{ color: 'var(--color-primary)' }}>Assessment</strong> tab and run a pipeline first.
        </div>
      )}
    </div>
  );
}
