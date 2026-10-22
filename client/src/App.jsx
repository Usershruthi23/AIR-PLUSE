
import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://air-pluse-1.onrender.com'
).replace(/\/$/, '');

const SCENARIOS = [
  { value: 'normal', label: 'Normal', pose: 'standing' },
  { value: 'irregular', label: 'Irregular', pose: 'sitting' },
  { value: 'inactivity', label: 'Inactivity', pose: 'lying' },
  { value: 'fall', label: 'Fall Detection', pose: 'fallen' },
];

const POSES = ['standing', 'sitting', 'lying', 'fallen'];

const css = `
*{box-sizing:border-box}
body{margin:0;background:#f4f7fb;color:#172033;font-family:Inter,Arial,sans-serif}
button,select{font:inherit}button{cursor:pointer}
.ap{min-height:100vh}
.topbar{background:white;border-bottom:1px solid #e5eaf2;padding:16px 25px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px}.logo{width:43px;height:43px;display:grid;place-items:center;border-radius:13px;color:white;background:linear-gradient(135deg,#2563eb,#06b6d4);font-size:25px}
.brand h1{font-size:21px;margin:0}.brand p{font-size:11px;color:#8390a5;margin:4px 0 0}
.status{font-size:11px;font-weight:700;color:#15803d;background:#dcfce7;padding:9px 12px;border-radius:25px}.status.off{color:#b91c1c;background:#fee2e2}
.layout{display:grid;grid-template-columns:220px minmax(0,1fr);min-height:calc(100vh - 76px)}
.sidebar{background:white;border-right:1px solid #e5eaf2;padding:22px 13px}
.navlabel{font-size:10px;letter-spacing:1.5px;color:#9aa4b6;font-weight:800;margin:8px 12px 13px}
.navitem{display:flex;align-items:center;gap:11px;width:100%;padding:12px;border:0;border-radius:10px;background:transparent;color:#637087;text-align:left;font-size:13px;margin-bottom:4px}
.navitem.active{background:#eff6ff;color:#2563eb;font-weight:800}
.sidebox{margin:25px 5px;padding:13px;background:#f5f8fc;border-radius:11px;color:#788399;font-size:11px;line-height:1.6}
.main{padding:25px;min-width:0}.pagehead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.pagehead h2{font-size:25px;margin:0;letter-spacing:-.6px}.pagehead p{font-size:12px;color:#8490a4;margin:7px 0 0}
.btn{border:1px solid #dfe6ef;background:white;padding:9px 13px;border-radius:9px;font-size:11px;font-weight:700;color:#344054}
.btn.primary{background:#2563eb;color:white;border-color:#2563eb}.btn.danger{color:#dc2626}.btn:disabled{opacity:.5;cursor:not-allowed}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:17px}
.card{background:white;border:1px solid #e7ecf3;border-radius:15px;padding:18px;min-width:0;box-shadow:0 3px 12px #17203305}
.metric-top{display:flex;justify-content:space-between;align-items:center;color:#788399;font-size:11px;gap:8px}
.metric-icon{width:34px;height:34px;display:grid;place-items:center;background:#eff6ff;border-radius:10px;font-size:17px}
.metric-value{font-size:28px;font-weight:800;letter-spacing:-.8px;margin:14px 0 5px}.metric-foot{font-size:10px;color:#8a94a6}
.two{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,1fr);gap:16px;margin-bottom:17px}
.three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-bottom:17px}
.sectionhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:15px}
.sectionhead h3{font-size:14px;margin:0}.sectionhead p{font-size:10px;color:#8993a5;margin:5px 0 0}
.pill{display:inline-block;padding:5px 8px;border-radius:20px;background:#f1f5f9;color:#64748b;font-size:10px;font-weight:800;white-space:nowrap}
.pill.ok{background:#dcfce7;color:#15803d}.pill.warn{background:#fef3c7;color:#92400e}.pill.bad{background:#fee2e2;color:#b91c1c}
.person-list{display:grid;gap:9px}
.person{display:flex;align-items:center;gap:10px;width:100%;border:1px solid #e8edf4;border-radius:11px;background:white;padding:11px;text-align:left}
.person.selected{border-color:#60a5fa;background:#f5f9ff}
.avatar{flex:0 0 37px;height:37px;display:grid;place-items:center;background:#eaf2ff;color:#2563eb;border-radius:10px;font-weight:800}
.person-name{font-size:12px;font-weight:800}.person-sub{font-size:10px;color:#8993a5;margin-top:4px}
.person-right{margin-left:auto;text-align:right}
.control{width:100%;padding:10px;border:1px solid #dfe6ef;border-radius:9px;background:white;color:#344054;margin:7px 0 12px;font-size:12px}
.fieldlabel{display:block;color:#657188;font-size:10px;font-weight:800;margin-top:9px}
.notice{padding:11px 13px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;color:#1d4ed8;font-size:11px;line-height:1.6;margin-top:12px}
.error{padding:12px;background:#fff1f2;color:#be123c;border:1px solid #fecdd3;border-radius:10px;font-size:12px;margin-bottom:14px;overflow-wrap:anywhere}
.success{padding:11px 13px;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:10px;font-size:12px;margin-bottom:14px}
.empty{padding:24px 8px;text-align:center;color:#8993a5;font-size:12px}
.pose-stage{min-height:255px;border-radius:13px;background:radial-gradient(ellipse at 50% 45%,#e7f3ff 0,#f2f8ff 47%,#f8fbff 75%);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.pose-stage:after{content:"";position:absolute;bottom:24px;width:150px;height:13px;border-radius:50%;background:#c8d9ed55}
.pose-figure{position:relative;width:150px;height:210px;z-index:1}
.head{position:absolute;left:59px;top:17px;width:34px;height:36px;background:#f0bf96;border-radius:48% 48% 44% 44%;border:2px solid #d7a17b;z-index:4}
.hair{position:absolute;left:57px;top:12px;width:38px;height:18px;border-radius:50% 50% 25% 25%;background:#35445d;z-index:5}
.neck{position:absolute;left:70px;top:48px;width:12px;height:13px;background:#e9b58c;z-index:2}
.torso{position:absolute;left:48px;top:57px;width:57px;height:70px;background:#3b82f6;border-radius:15px 15px 10px 10px;transform-origin:50% 10%;z-index:3}
.arm{position:absolute;top:65px;width:14px;height:61px;border-radius:12px;background:#f0bf96;transform-origin:50% 8%;z-index:2}
.arm.left{left:39px;transform:rotate(12deg)}.arm.right{left:100px;transform:rotate(-12deg)}
.leg{position:absolute;top:119px;width:19px;height:67px;border-radius:10px;background:#344b73;transform-origin:50% 7%;z-index:2}
.leg.left{left:56px}.leg.right{left:81px}
.foot{position:absolute;top:178px;width:31px;height:12px;border-radius:10px;background:#27364e;z-index:2}
.foot.left{left:43px}.foot.right{left:76px}
.pose-figure.sitting .torso{top:61px;height:60px;transform:rotate(-5deg)}
.pose-figure.sitting .arm.left{top:70px;transform:rotate(-35deg)}.pose-figure.sitting .arm.right{top:70px;transform:rotate(35deg)}
.pose-figure.sitting .leg.left{top:112px;height:48px;transform:rotate(-85deg);left:53px}
.pose-figure.sitting .leg.right{top:112px;height:48px;transform:rotate(-85deg);left:83px}
.pose-figure.sitting .foot.left{top:145px;left:22px}.pose-figure.sitting .foot.right{top:145px;left:51px}
.pose-figure.lying .head{left:104px;top:85px}.pose-figure.lying .hair{left:102px;top:80px}
.pose-figure.lying .neck{left:115px;top:112px}
.pose-figure.lying .torso{left:48px;top:101px;width:65px;height:35px;transform:rotate(0)}
.pose-figure.lying .arm.left{left:57px;top:91px;height:42px;transform:rotate(35deg)}
.pose-figure.lying .arm.right{left:70px;top:125px;height:37px;transform:rotate(70deg)}
.pose-figure.lying .leg.left{left:25px;top:109px;height:25px;transform:rotate(90deg)}
.pose-figure.lying .leg.right{left:23px;top:128px;height:25px;transform:rotate(90deg)}
.pose-figure.lying .foot.left{left:5px;top:108px}.pose-figure.lying .foot.right{left:5px;top:128px}
.pose-figure.fallen .head{left:103px;top:109px;transform:rotate(45deg)}
.pose-figure.fallen .hair{left:101px;top:104px;transform:rotate(45deg)}
.pose-figure.fallen .neck{left:112px;top:134px}
.pose-figure.fallen .torso{left:48px;top:119px;width:65px;height:35px;transform:rotate(-10deg)}
.pose-figure.fallen .arm.left{left:57px;top:105px;height:45px;transform:rotate(55deg)}
.pose-figure.fallen .arm.right{left:80px;top:140px;height:35px;transform:rotate(85deg)}
.pose-figure.fallen .leg.left{left:24px;top:119px;height:30px;transform:rotate(65deg)}
.pose-figure.fallen .leg.right{left:25px;top:143px;height:29px;transform:rotate(100deg)}
.pose-figure.fallen .foot.left{left:6px;top:133px}.pose-figure.fallen .foot.right{left:5px;top:151px}
.pose-caption{text-align:center;margin-top:12px;font-size:12px;font-weight:800;color:#344054}
.pose-sub{text-align:center;margin-top:4px;font-size:10px;color:#8993a5}
.chart{width:100%;height:160px;display:block}
.chart-label{font-size:10px;fill:#8993a5}
.tablewrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;text-align:left;font-size:11px}
th{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#8993a5}
th,td{padding:12px 9px;border-bottom:1px solid #edf0f5;white-space:nowrap}
tbody tr:last-child td{border-bottom:0}
.alertrow{display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #edf0f5}
.alertrow:last-child{border-bottom:0}
.alertsymbol{width:32px;height:32px;display:grid;place-items:center;background:#fff1f2;border-radius:9px;flex-shrink:0}
.alerttitle{font-size:11px;font-weight:800}.alertsub{font-size:10px;color:#8993a5;margin-top:4px;line-height:1.5}
.alertaction{margin-left:auto}
.footer{text-align:center;color:#9aa4b6;font-size:10px;padding:19px 0 0}
@media(max-width:1050px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.three{grid-template-columns:1fr 1fr}.two{grid-template-columns:1fr}}
@media(max-width:700px){.layout{grid-template-columns:1fr}.sidebar{display:flex;gap:4px;overflow-x:auto;padding:9px;border-right:0;border-bottom:1px solid #e5eaf2}.navlabel,.sidebox{display:none}.navitem{width:auto;white-space:nowrap;margin:0;padding:10px}.main{padding:15px}.topbar{padding:13px 15px}.grid{gap:9px}.card{padding:13px}.metric-value{font-size:23px}.three{grid-template-columns:1fr}.pagehead h2{font-size:22px}}
`;

function arr(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function idOf(x) {
  return x?.id ?? x?.personId ?? x?.person_id ?? x?._id ?? '';
}

function nameOf(x) {
  return x?.name ?? x?.fullName ?? x?.full_name ?? `Person ${idOf(x)}`;
}

function valueOf(x, keys) {
  for (const key of keys) {
    if (x?.[key] !== undefined && x?.[key] !== null) return x[key];
  }
  return null;
}

function timeOf(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function riskClass(value) {
  const s = String(value ?? '').toLowerCase();
  if (/critical|high|fall/.test(s)) return 'bad';
  if (/medium|warning|irregular/.test(s)) return 'warn';
  if (/low|normal|resolved|acknowledged/.test(s)) return 'ok';
  return '';
}

function PoseFigure({ pose }) {
  return (
    <>
      <div className="pose-stage" aria-label={`Illustration of a person ${pose}`}>
        <div className={`pose-figure ${POSES.includes(pose) ? pose : 'standing'}`}>
          <div className="hair" />
          <div className="head" />
          <div className="neck" />
          <div className="torso" />
          <div className="arm left" />
          <div className="arm right" />
          <div className="leg left" />
          <div className="leg right" />
          <div className="foot left" />
          <div className="foot right" />
        </div>
      </div>
      <div className="pose-caption">{pose.charAt(0).toUpperCase() + pose.slice(1)} pose</div>
      <div className="pose-sub">Illustrative simulated body posture</div>
    </>
  );
}

function SignalChart({ scenario }) {
  const points = Array.from({ length: 64 }, (_, i) => {
    const irregular = scenario === 'irregular' ? Math.sin(i * 2.15) * 8 : 0;
    const fall = scenario === 'fall' && i > 43 && i < 49 ? (i % 2 ? 28 : -20) : 0;
    const inactivity = scenario === 'inactivity' ? 2 : 0;
    const y = 76 + Math.sin(i * 0.56) * (scenario === 'inactivity' ? 3 : 17)
      + Math.sin(i * 1.22) * 5 + irregular + fall + inactivity;
    return `${(i / 63) * 400},${Math.max(12, Math.min(145, y))}`;
  }).join(' ');

  return (
    <svg className="chart" viewBox="0 0 400 160" role="img" aria-label="Simulated signal waveform">
      {[30, 60, 90, 120].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#edf1f7" strokeDasharray="4 5" />)}
      <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <text x="3" y="154" className="chart-label">0s</text>
      <text x="184" y="154" className="chart-label">Time →</text>
      <text x="365" y="154" className="chart-label">60s</text>
    </svg>
  );
}

function TrendChart({ history }) {
  const rows = [...history].slice(0, 12).reverse();
  const values = rows.map(row => Number(valueOf(row, ['heartRate', 'heart_rate', 'hr', 'bpm']))).filter(Number.isFinite);

  if (values.length < 2) {
    return <div className="empty">Run more simulations to build a trend.</div>;
  }

  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const points = values.map((v, i) => {
    const x = 10 + (i / (values.length - 1)) * 380;
    const y = 135 - ((v - min) / Math.max(1, max - min)) * 110;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="chart" viewBox="0 0 400 160" role="img" aria-label="Simulated heart-rate trend">
      {[30, 60, 90, 120].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#edf1f7" strokeDasharray="4 5" />)}
      <polyline points={points} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <text x="4" y="154" className="chart-label">Older</text>
      <text x="354" y="154" className="chart-label">Latest →</text>
    </svg>
  );
}

function RiskChart({ alerts }) {
  const high = alerts.filter(a => /high|critical|fall/i.test(`${a?.severity ?? ''} ${a?.level ?? ''} ${a?.type ?? ''} ${a?.title ?? ''}`)).length;
  const other = alerts.length - high;
  const total = Math.max(1, high + other);
  const circumference = 2 * Math.PI * 37;
  const highLength = (high / total) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, minHeight: 160 }}>
      <svg width="118" height="118" viewBox="0 0 100 100" role="img" aria-label="Alert distribution chart">
        <circle cx="50" cy="50" r="37" fill="none" stroke="#dbeafe" strokeWidth="13" />
        {high > 0 && <circle cx="50" cy="50" r="37" fill="none" stroke="#f97373" strokeWidth="13" strokeDasharray={`${highLength} ${circumference - highLength}`} transform="rotate(-90 50 50)" />}
        <text x="50" y="47" textAnchor="middle" fontSize="19" fontWeight="800" fill="#172033">{alerts.length}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#8993a5">alerts</text>
      </svg>
      <div style={{ fontSize: 11, lineHeight: 2.2, color: '#657188' }}>
        <div><span style={{ color: '#f97373' }}>●</span> Higher-risk keywords: {high}</div>
        <div><span style={{ color: '#93c5fd' }}>●</span> Other alerts: {other}</div>
        <div style={{ color: '#8993a5', fontSize: 9 }}>Demo alert categories only</div>
      </div>
    </div>
  );
}

export default function App() {
  const [people, setPeople] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [scenario, setScenario] = useState('normal');
  const [pose, setPose] = useState('standing');
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState('Overview');

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
    }
    return data;
  }, []);

  const refresh = useCallback(async (personId = selectedPerson) => {
    setError('');
    try {
      const [peopleResult, alertsResult, healthResult] = await Promise.all([
        request('/people'),
        request('/alerts'),
        request('/health'),
      ]);

      const nextPeople = arr(peopleResult, ['people', 'data', 'items']);
      const nextAlerts = arr(alertsResult, ['alerts', 'data', 'items']);
      setPeople(nextPeople);
      setAlerts(nextAlerts);
      setHealth(healthResult);

      const currentId = personId || (nextPeople.length ? String(idOf(nextPeople[0])) : '');
      if (currentId) {
        setSelectedPerson(String(currentId));
        const selected = nextPeople.find(p => String(idOf(p)) === String(currentId));
        if (selected?.pose && POSES.includes(String(selected.pose).toLowerCase())) {
          setPose(String(selected.pose).toLowerCase());
        }

        try {
          const result = await request(`/history?personId=${encodeURIComponent(currentId)}`);
          setHistory(arr(result, ['history', 'records', 'data', 'items']));
        } catch {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    } catch (e) {
      setError(`${e.message}. Check the Render API and frontend environment configuration.`);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [request, selectedPerson]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activePerson = people.find(p => String(idOf(p)) === String(selectedPerson)) || people[0];
  const openAlerts = alerts.filter(a => !['acknowledged', 'resolved', 'closed'].includes(String(a?.status ?? '').toLowerCase()));
  const latest = history[0] || {};
  const heartRate = valueOf(latest, ['heartRate', 'heart_rate', 'hr', 'bpm']);
  const breathingRate = valueOf(latest, ['breathingRate', 'breathing_rate', 'respiratoryRate', 'respiratory_rate', 'breathsPerMinute']);
  const risk = valueOf(latest, ['riskLevel', 'risk_level', 'risk', 'status']);
  const currentScenario = SCENARIOS.find(s => s.value === scenario);

  async function runSimulation() {
    if (!selectedPerson) {
      setError('No demo person is available. Check the /api/people endpoint.');
      return;
    }

    setRunning(true);
    setError('');
    setNotice('');
    try {
      await request('/simulate', {
        method: 'POST',
        body: JSON.stringify({
          personId: selectedPerson,
          scenario,
          pose,
        }),
      });
      setNotice(`${currentScenario?.label ?? scenario} simulation submitted successfully.`);
      await refresh(selectedPerson);
    } catch (e) {
      setError(`Simulation failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  async function acknowledgeAlert(alert) {
    if (!idOf(alert)) {
      setError('This alert does not include an ID, so it cannot be acknowledged.');
      return;
    }
    setError('');
    try {
      await request(`/alerts/${encodeURIComponent(idOf(alert))}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setNotice('Alert acknowledged.');
      await refresh(selectedPerson);
    } catch (e) {
      setError(`Could not acknowledge alert: ${e.message}`);
    }
  }

  async function resetDemo() {
    if (!window.confirm('Reset demo data? This may clear simulation history and alerts.')) return;
    setError('');
    setNotice('');
    try {
      await request('/reset', { method: 'POST', body: JSON.stringify({}) });
      setNotice('Demo reset completed.');
      await refresh(selectedPerson);
    } catch (e) {
      setError(`Reset failed: ${e.message}`);
    }
  }

  const navigation = [
    ['Overview', '▦'],
    ['People & Poses', '♙'],
    ['Signal Lab', '⌁'],
    ['Alert History', '⚑'],
    ['Reading History', '◷'],
  ];

  return (
    <div className="ap">
      <style>{css}</style>
      <header className="topbar">
        <div className="brand">
          <div className="logo">⌁</div>
          <div>
            <h1>AirPulse<span style={{ color: '#2563eb' }}>+</span></h1>
            <p>Contactless Vital Sign Detection · Simulation Platform</p>
          </div>
        </div>
        <div className={`status ${health ? '' : 'off'}`}>
          ● {health ? (health.pythonService ? 'API Connected' : 'API Online · Fallback Mode') : 'Connecting / Offline'}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="navlabel">WORKSPACE</div>
          {navigation.map(([label, icon]) => (
            <button key={label} className={`navitem ${page === label ? 'active' : ''}`} onClick={() => setPage(label)}>
              <span>{icon}</span>{label}
            </button>
          ))}
          <div className="sidebox">
            <strong style={{ color: '#344054' }}>Demo mode</strong><br />
            Person poses, signals, readings, and alerts are simulated for academic demonstration.
          </div>
        </aside>

        <main className="main">
          <div className="pagehead">
            <div>
              <h2>{page}</h2>
              <p>Explore simulated body poses, signal patterns, readings, and event alerts.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => refresh(selectedPerson)} disabled={loading}>↻ Refresh</button>
              <button className="btn danger" onClick={resetDemo}>Reset demo</button>
            </div>
          </div>

          {error && <div className="error"><strong>Request error</strong><div style={{ marginTop: 4 }}>{error}</div></div>}
          {notice && <div className="success">{notice}</div>}

          {(page === 'Overview' || page === 'People & Poses') && (
            <>
              <div className="grid">
                <div className="card"><div className="metric-top">Demo People <span className="metric-icon">♙</span></div><div className="metric-value">{people.length}</div><div className="metric-foot">Simulation profiles</div></div>
                <div className="card"><div className="metric-top">Open Alerts <span className="metric-icon">⚑</span></div><div className="metric-value">{openAlerts.length}</div><div className="metric-foot">Awaiting acknowledgement</div></div>
                <div className="card"><div className="metric-top">Heart Rate <span className="metric-icon">♡</span></div><div className="metric-value">{heartRate ?? '—'}<span style={{ fontSize: 11 }}> bpm</span></div><div className="metric-foot">Latest available simulated value</div></div>
                <div className="card"><div className="metric-top">Breathing Rate <span className="metric-icon">⌁</span></div><div className="metric-value">{breathingRate ?? '—'}<span style={{ fontSize: 11 }}> /min</span></div><div className="metric-foot">Latest available simulated value</div></div>
              </div>

              <div className="two">
                <section className="card">
                  <div className="sectionhead">
                    <div><h3>People & Interactive Poses</h3><p>Select a demo profile and change the posture.</p></div>
                    <span className="pill">{people.length} profiles</span>
                  </div>

                  <div className="person-list" style={{ marginBottom: 16 }}>
                    {people.map((person, index) => (
                      <button key={idOf(person) || index} className={`person ${String(idOf(person)) === String(selectedPerson) ? 'selected' : ''}`} onClick={() => { setSelectedPerson(String(idOf(person))); refresh(String(idOf(person))); }}>
                        <div className="avatar">{nameOf(person).charAt(0).toUpperCase()}</div>
                        <div><div className="person-name">{nameOf(person)}</div><div className="person-sub">ID: {idOf(person)}{person?.age ? ` · Age ${person.age}` : ''}</div></div>
                        <div className="person-right"><span className={`pill ${String(idOf(person)) === String(selectedPerson) ? 'ok' : ''}`}>{String(idOf(person)) === String(selectedPerson) ? 'Selected' : 'View'}</span></div>
                      </button>
                    ))}
                    {!people.length && <div className="empty">{loading ? 'Loading demo profiles…' : 'No profiles returned by the API.'}</div>}
                  </div>

                  <label className="fieldlabel">SELECT POSE</label>
                  <select className="control" value={pose} onChange={e => setPose(e.target.value)}>
                    <option value="standing">Standing</option>
                    <option value="sitting">Sitting</option>
                    <option value="lying">Lying</option>
                    <option value="fallen">Fallen</option>
                  </select>
                  <PoseFigure pose={pose} />
                  <div className="notice">The figure is an illustrative pose visualization. It does not represent a camera feed or real-time human tracking.</div>
                </section>

                <div>
                  <section className="card" style={{ marginBottom: 16 }}>
                    <div className="sectionhead"><div><h3>Simulation Controls</h3><p>Generate a sample event for the selected profile.</p></div><span>⚡</span></div>
                    <label className="fieldlabel">SELECT PERSON</label>
                    <select className="control" value={selectedPerson} onChange={e => { setSelectedPerson(e.target.value); refresh(e.target.value); }}>
                      {people.length === 0 && <option value="">No people available</option>}
                      {people.map((p, i) => <option key={idOf(p) || i} value={String(idOf(p))}>{nameOf(p)}</option>)}
                    </select>
                    <label className="fieldlabel">SCENARIO</label>
                    <select className="control" value={scenario} onChange={e => { const next = e.target.value; setScenario(next); const match = SCENARIOS.find(s => s.value === next); if (match) setPose(match.pose); }}>
                      {SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <div className="notice" style={{ marginTop: 0 }}>
                      <strong>{currentScenario?.label}</strong><br />
                      Pose: {pose}. Run the simulation to submit these settings to the backend.
                    </div>
                    <button className="btn primary" style={{ width: '100%', marginTop: 14 }} disabled={running || !selectedPerson} onClick={runSimulation}>
                      {running ? 'Running simulation…' : '▶ Run Simulation'}
                    </button>
                  </section>

                  <section className="card">
                    <div className="sectionhead"><div><h3>Selected Profile</h3><p>Latest available information.</p></div></div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{activePerson ? nameOf(activePerson) : 'No person selected'}</div>
                    <p className="small">Profile ID: {activePerson ? idOf(activePerson) : '—'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, gap: 10 }}>
                      <span className="small">Latest risk/status</span><span className={`pill ${riskClass(risk)}`}>{risk ?? 'No reading'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10 }}>
                      <span className="small">Current pose</span><span className="pill">{pose}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10 }}>
                      <span className="small">Reading records</span><strong>{history.length}</strong>
                    </div>
                  </section>
                </div>
              </div>

              <div className="three">
                <section className="card"><div className="sectionhead"><div><h3>Simulated CSI-like Signal</h3><p>Illustrative waveform, not captured Wi-Fi data.</p></div></div><SignalChart scenario={scenario} /></section>
                <section className="card"><div className="sectionhead"><div><h3>Heart-Rate Trend</h3><p>Based on returned history records.</p></div></div><TrendChart history={history} /></section>
                <section className="card"><div className="sectionhead"><div><h3>Alert Distribution</h3><p>Simple classification of alert text.</p></div></div><RiskChart alerts={alerts} /></section>
              </div>

              <div className="two">
                <section className="card">
                  <div className="sectionhead"><div><h3>Recent Reading History</h3><p>Most recent records for the selected person.</p></div><span className="pill">{history.length} records</span></div>
                  <div className="tablewrap">
                    <table>
                      <thead><tr><th>Time</th><th>Heart rate</th><th>Breathing</th><th>Risk</th></tr></thead>
                      <tbody>
                        {history.slice(0, 7).map((row, i) => {
                          const r = valueOf(row, ['riskLevel', 'risk_level', 'risk', 'status']);
                          return <tr key={idOf(row) || i}><td>{timeOf(valueOf(row, ['timestamp', 'createdAt', 'created_at', 'time']))}</td><td>{valueOf(row, ['heartRate', 'heart_rate', 'hr', 'bpm']) ?? '—'}</td><td>{valueOf(row, ['breathingRate', 'breathing_rate', 'respiratoryRate', 'respiratory_rate']) ?? '—'}</td><td><span className={`pill ${riskClass(r)}`}>{r ?? '—'}</span></td></tr>;
                        })}
                      </tbody>
                    </table>
                    {!history.length && <div className="empty">Run a simulation to create reading history.</div>}
                  </div>
                </section>

                <section className="card">
                  <div className="sectionhead"><div><h3>Recent Alerts</h3><p>Review recent events and acknowledge them.</p></div><span className="pill">{openAlerts.length} open</span></div>
                  {alerts.slice(0, 6).map((alert, i) => (
                    <div className="alertrow" key={idOf(alert) || i}>
                      <div className="alertsymbol">⚠</div>
                      <div style={{ flex: 1 }}>
                        <div className="alerttitle">{alert?.title ?? alert?.type ?? alert?.message ?? 'Monitoring alert'}</div>
                        <div className="alertsub">{alert?.message && alert?.title ? `${alert.message} · ` : ''}{timeOf(valueOf(alert, ['timestamp', 'createdAt', 'created_at', 'time']))}</div>
                        <div style={{ marginTop: 6 }}><span className={`pill ${riskClass(alert?.severity ?? alert?.level ?? alert?.status)}`}>{alert?.status ?? alert?.severity ?? alert?.level ?? 'New'}</span></div>
                      </div>
                      <div className="alertaction">
                        {!['acknowledged', 'resolved', 'closed'].includes(String(alert?.status ?? '').toLowerCase()) && <button className="btn" onClick={() => acknowledgeAlert(alert)}>Ack</button>}
                      </div>
                    </div>
                  ))}
                  {!alerts.length && <div className="empty">No alerts returned by the API.</div>}
                </section>
              </div>
            </>
          )}

          {page === 'Signal Lab' && (
            <>
              <div className="two">
                <section className="card">
                  <div className="sectionhead"><div><h3>Signal Lab</h3><p>Change the scenario to change the illustrative signal pattern.</p></div><span className="pill">Simulation</span></div>
                  <label className="fieldlabel">SIGNAL SCENARIO</label>
                  <select className="control" value={scenario} onChange={e => { const next = e.target.value; setScenario(next); setPose(SCENARIOS.find(s => s.value === next)?.pose ?? pose); }}>
                    {SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <SignalChart scenario={scenario} />
                  <div className="notice">Waveform is generated locally for visualization. It is not a measurement from a Wi-Fi router or physical sensor.</div>
                </section>
                <section className="card">
                  <div className="sectionhead"><div><h3>Pose Preview</h3><p>Pose selected in the simulation controls.</p></div></div>
                  <PoseFigure pose={pose} />
                  <button className="btn primary" style={{ width: '100%', marginTop: 14 }} onClick={runSimulation} disabled={running || !selectedPerson}>{running ? 'Running…' : '▶ Submit Simulation'}</button>
                </section>
              </div>
              <section className="card">
                <div className="sectionhead"><div><h3>Reading Trend</h3><p>Visualized from stored API history.</p></div></div>
                <TrendChart history={history} />
              </section>
            </>
          )}

          {page === 'Alert History' && (
            <section className="card">
              <div className="sectionhead"><div><h3>Alert History</h3><p>Simulated events returned by the API.</p></div><span className="pill">{alerts.length} total</span></div>
              {alerts.map((alert, i) => (
                <div className="alertrow" key={idOf(alert) || i}>
                  <div className="alertsymbol">⚠</div>
                  <div style={{ flex: 1 }}>
                    <div className="alerttitle">{alert?.title ?? alert?.type ?? alert?.message ?? 'Monitoring alert'}</div>
                    <div className="alertsub">{alert?.message ?? ''} · {timeOf(valueOf(alert, ['timestamp', 'createdAt', 'created_at', 'time']))}</div>
                    <div style={{ marginTop: 7 }}><span className={`pill ${riskClass(alert?.severity ?? alert?.level ?? alert?.status)}`}>{alert?.status ?? alert?.severity ?? 'New'}</span></div>
                  </div>
                  {!['acknowledged', 'resolved', 'closed'].includes(String(alert?.status ?? '').toLowerCase()) && <button className="btn" onClick={() => acknowledgeAlert(alert)}>Acknowledge</button>}
                </div>
              ))}
              {!alerts.length && <div className="empty">No alerts available yet. Run a simulation.</div>}
            </section>
          )}

          {page === 'Reading History' && (
            <section className="card">
              <div className="sectionhead">
                <div><h3>Reading History</h3><p>{activePerson ? `Selected profile: ${nameOf(activePerson)}` : 'Select a profile to view history.'}</p></div>
                <select className="control" style={{ width: 'auto', margin: 0 }} value={selectedPerson} onChange={e => { setSelectedPerson(e.target.value); refresh(e.target.value); }}>
                  {people.map((p, i) => <option key={idOf(p) || i} value={String(idOf(p))}>{nameOf(p)}</option>)}
                </select>
              </div>
              <div className="tablewrap">
                <table>
                  <thead><tr><th>Timestamp</th><th>Heart rate</th><th>Breathing rate</th><th>Pose</th><th>Risk</th></tr></thead>
                  <tbody>
                    {history.map((row, i) => {
                      const r = valueOf(row, ['riskLevel', 'risk_level', 'risk', 'status']);
                      return <tr key={idOf(row) || i}><td>{timeOf(valueOf(row, ['timestamp', 'createdAt', 'created_at', 'time']))}</td><td>{valueOf(row, ['heartRate', 'heart_rate', 'hr', 'bpm']) ?? '—'}</td><td>{valueOf(row, ['breathingRate', 'breathing_rate', 'respiratoryRate', 'respiratory_rate']) ?? '—'}</td><td>{valueOf(row, ['pose', 'posture', 'detectedPose']) ?? '—'}</td><td><span className={`pill ${riskClass(r)}`}>{r ?? '—'}</span></td></tr>;
                    })}
                  </tbody>
                </table>
                {!history.length && <div className="empty">No records available. Run a simulation first.</div>}
              </div>
            </section>
          )}

          <div className="footer">
            AirPulse+ · Academic prototype · Simulated signals and readings only · Not for medical decisions
          </div>
        </main>
      </div>
    </div>
  );
}
