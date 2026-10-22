import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bell, BrainCircuit, Check, ChevronDown, CircleHelp, HeartPulse, LayoutDashboard, RadioTower, RotateCcw, ShieldCheck, Signal, Users, Wind, Waves, Zap } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement);

const nav = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'people', label: 'People & poses', icon: Users },
  { id: 'signal', label: 'Signal lab', icon: RadioTower },
  { id: 'alerts', label: 'Alert history', icon: Bell }
];
const scenarios = [
  { value: 'normal', label: 'Normal baseline', hint: 'Stable synthetic pattern' },
  { value: 'irregular', label: 'Irregular pattern', hint: 'Elevated demo risk' },
  { value: 'inactivity', label: 'Inactivity', hint: 'Low-motion simulation' },
  { value: 'fall', label: 'Fall simulation', hint: 'High-priority demo alert' }
];
const poses = ['standing', 'sitting', 'lying', 'fallen'];
const fmt = (n, digits=0) => Number(n ?? 0).toFixed(digits);

export default function App() {
  const [page, setPage] = useState('overview');
  const [people, setPeople] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState('P001');
  const [scenario, setScenario] = useState('normal');
  const [pose, setPose] = useState('standing');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [apiStatus, setApiStatus] = useState('Checking');
  const [lastAnalysis, setLastAnalysis] = useState(null);

  async function request(path, options={}) {
    const res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }
  async function refresh() {
    try {
      const [p, a, h, health] = await Promise.all([
        request('/people'), request('/alerts'), request(`/history?personId=${encodeURIComponent(selected)}`), request('/health')
      ]);
      setPeople(p); setAlerts(a); setHistory(h); setApiStatus(health.pythonService ? 'Connected' : 'Fallback mode');
      const person = p.find(x => x.id === selected);
      if (person) { setPose(person.pose || 'standing'); setLastAnalysis(person.latestAnalysis || null); }
    } catch (e) { setApiStatus('Offline'); setToast(e.message); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { request(`/history?personId=${encodeURIComponent(selected)}`).then(setHistory).catch(()=>{}); }, [selected]);
  function notify(msg) { setToast(msg); window.setTimeout(() => setToast(''), 3200); }
  async function runSimulation() {
    setLoading(true);
    try {
      const result = await request('/simulate', { method: 'POST', body: JSON.stringify({ personId: selected, scenario, pose }) });
      setLastAnalysis(result.analysis);
      notify('Simulation complete — generated data only.');
      await refresh();
      setPage('overview');
    } catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }
  async function acknowledge(id) {
    try { await request(`/alerts/${id}/acknowledge`, { method: 'POST', body: '{}' }); await refresh(); notify('Demo alert acknowledged.'); }
    catch (e) { notify(e.message); }
  }
  async function resetDemo() {
    if (!window.confirm('Reset simulated people, readings, and alert history?')) return;
    try { await request('/reset', { method: 'POST', body: '{}' }); setLastAnalysis(null); await refresh(); notify('Demo data reset.'); }
    catch (e) { notify(e.message); }
  }

  const activePerson = people.find(p => p.id === selected) || people[0];
  const risk = activePerson?.risk || 'LOW';
  const stats = useMemo(() => ({
    total: people.length,
    stable: people.filter(p => p.risk === 'LOW').length,
    elevated: people.filter(p => ['MEDIUM','HIGH'].includes(p.risk)).length,
    critical: people.filter(p => p.risk === 'CRITICAL').length
  }), [people]);
  const trendData = useMemo(() => {
    const points = history.slice(-14);
    return { labels: points.map((x, i) => x.timeLabel || `T-${points.length-i}`), datasets: [
      { label: 'Heart rate (simulated)', data: points.map(x=>x.heartRate), borderColor: '#2f80ed', backgroundColor: 'rgba(47,128,237,.10)', fill: true, tension: .35, pointRadius: 2 },
      { label: 'Breathing rate (simulated)', data: points.map(x=>x.breathingRate), borderColor: '#18b6a4', backgroundColor: 'rgba(24,182,164,.08)', fill: false, tension: .35, pointRadius: 2 }
    ]};
  }, [history]);
  const signalData = useMemo(() => {
    const arr = lastAnalysis?.signal || Array.from({length: 50}, (_,i)=>Math.sin(i*.43)*.35 + Math.cos(i*.17)*.2);
    return { labels: arr.map((_,i)=>i+1), datasets: [{ label: 'Synthetic CSI-like amplitude', data: arr, borderColor: '#7b61ff', backgroundColor: 'rgba(123,97,255,.12)', fill: true, pointRadius: 0, borderWidth: 2, tension: .25 }] };
  }, [lastAnalysis]);
  const lineOptions = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:true, labels:{usePointStyle:true, boxWidth:7, color:'#728097'}} }, scales:{ x:{grid:{display:false}, ticks:{color:'#8793a5', maxTicksLimit:7}}, y:{grid:{color:'#edf0f5'}, ticks:{color:'#8793a5'}} } };
  const riskColor = { LOW:'#1da88a', MEDIUM:'#e3a33d', HIGH:'#f07d47', CRITICAL:'#e55365' };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Waves size={24}/></div><div><strong>AirPulse<span>+</span></strong><small>SIGNAL INTELLIGENCE</small></div></div>
      <div className="workspace"><div className="workspace-icon"><Activity size={18}/></div><div><b>Academic workspace</b><small>Simulation environment</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(item => { const Icon=item.icon; return <button key={item.id} className={`nav-item ${page===item.id?'active':''}`} onClick={()=>setPage(item.id)}><Icon size={18}/><span>{item.label}</span>{item.id==='alerts'&&alerts.some(a=>!a.acknowledged)&&<i className="nav-dot"/>}</button>; })}</nav>
      <div className="side-spacer"/>
      <div className="simulation-card"><div className="simulation-icon"><ShieldCheck size={19}/></div><b>Simulation mode</b><p>All readings are generated for academic demonstration.</p><span><i/> No hardware connected</span></div>
      <div className="user-row"><div className="avatar user-avatar">GS</div><div><b>Project operator</b><small>Demo access</small></div><ChevronDown size={15}/></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="mobile-brand"><Waves size={22}/> AirPulse+</div><div className="crumb">Workspace <span>/</span> <b>{nav.find(n=>n.id===page)?.label || 'Overview'}</b></div><div className="top-actions"><span className={`api-pill ${apiStatus==='Connected'?'ok':apiStatus==='Offline'?'bad':''}`}><i/>{apiStatus==='Connected'?'API connected':apiStatus==='Fallback mode'?'Python fallback':apiStatus}</span><button className="icon-button" title="Reset demo" onClick={resetDemo}><RotateCcw size={17}/></button><div className="avatar top-avatar">GS</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> AIRPULSE+ MONITORING CONSOLE</div><h1>{page==='overview'?'Good day, Operator':page==='people'?'People & poses':page==='signal'?'Signal processing lab':'Alert history'}</h1><p>{page==='overview'?'Review the current simulated environment and generated signal insights.':page==='people'?'Choose a fictional demo profile and change the simulated pose.':page==='signal'?'Inspect synthetic CSI-like signals and the feature extraction pipeline.':'Review and acknowledge generated demo alerts.'}</p></div><div className="heading-actions"><span className="demo-badge"><span/> SIMULATED DATA</span><button className="button button-primary" onClick={()=>setPage('signal')}><Zap size={16}/> Open signal lab</button></div></div>
        <div className="notice"><div className="notice-icon"><CircleHelp size={19}/></div><div><b>Research prototype — not a real vital-sign monitor</b><p>CSI-like waveforms, heart rate, breathing rate, AI scores and alerts below are simulated. No actual WiFi CSI is captured.</p></div></div>

        {page==='overview' && <>
          <div className="metric-grid">
            <Metric icon={<Users/>} label="Demo profiles" value={stats.total} sub="Fictional people" tone="blue"/>
            <Metric icon={<HeartPulse/>} label="Stable simulations" value={stats.stable} sub="Low demo risk" tone="green"/>
            <Metric icon={<Activity/>} label="Elevated risk" value={stats.elevated} sub="Medium or high" tone="amber"/>
            <Metric icon={<AlertTriangle/>} label="Critical scenarios" value={stats.critical} sub="Requires demo review" tone="red"/>
          </div>
          <div className="two-col">
            <section className="panel"><PanelTitle title="Simulated vital signs" subtitle="Latest generated values for the selected profile" action={<span className="live-label"><i/> DEMO FEED</span>}/>
              <div className="person-select-row"><div className="avatar person-avatar">{(activePerson?.name||'Demo').split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div className="person-ident"><b>{activePerson?.name||'Select a profile'}</b><small>{activePerson?.ageGroup||'Simulation profile'} · {activePerson?.id||'—'}</small></div><select value={selected} onChange={e=>setSelected(e.target.value)}>{people.map(p=><option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}</select></div>
              <div className="vitals-grid"><Vital icon={<HeartPulse/>} name="Heart rate" value={activePerson?.heartRate??'—'} unit="bpm" tone="coral"/><Vital icon={<Wind/>} name="Breathing rate" value={activePerson?.breathingRate??'—'} unit="breaths/min" tone="teal"/><Vital icon={<Activity/>} name="Motion index" value={fmt(activePerson?.motionIndex,2)} unit="relative" tone="purple"/></div>
              <div className="risk-line"><div><span className="muted">Demo risk classification</span><b style={{color:riskColor[risk]||'#1da88a'}}>{risk}</b></div><div className="risk-track"><span style={{width:`${activePerson?.riskScore||0}%`,background:riskColor[risk]||'#1da88a'}}/></div><small>{activePerson?.riskScore||0}/100 heuristic score</small></div>
            </section>
            <section className="panel"><PanelTitle title="Pose & scenario simulator" subtitle="Generate a new synthetic observation"/><div className="simulator-layout"><PoseFigure pose={pose}/><div className="simulator-controls"><label>Selected profile</label><select value={selected} onChange={e=>setSelected(e.target.value)}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label>Simulated pose</label><select value={pose} onChange={e=>setPose(e.target.value)}>{poses.map(p=><option value={p} key={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}</select><label>Scenario</label><select value={scenario} onChange={e=>setScenario(e.target.value)}>{scenarios.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select><p className="control-hint">{scenarios.find(s=>s.value===scenario)?.hint}</p><button className="button button-primary full-button" disabled={loading||!people.length} onClick={runSimulation}>{loading?'Generating…':<><Zap size={16}/> Run simulation</>}</button></div></div></section>
          </div>
          <div className="two-col lower-grid">
            <section className="panel chart-panel"><PanelTitle title="Generated reading trend" subtitle="Recent synthetic values · mixed units are illustrative"/><div className="chart-wrap"><Line data={trendData} options={lineOptions}/></div></section>
            <section className="panel"><PanelTitle title="Risk distribution" subtitle="Current simulated profile classifications"/><div className="risk-chart-layout"><div className="donut-wrap"><Doughnut data={{labels:['Low','Medium/High','Critical'],datasets:[{data:[stats.stable,stats.elevated,stats.critical],backgroundColor:['#20b58e','#e9ad45','#e55365'],borderWidth:0,hoverOffset:4}]}} options={{cutout:'76%',plugins:{legend:{display:false}}}}/><div className="donut-center"><b>{people.length}</b><small>profiles</small></div></div><div className="legend-list"><LegendDot color="#20b58e" label="Low risk" value={stats.stable}/><LegendDot color="#e9ad45" label="Elevated" value={stats.elevated}/><LegendDot color="#e55365" label="Critical" value={stats.critical}/></div></div><div className="mini-footnote"><BrainCircuit size={15}/> Heuristic score over generated features, not a trained medical AI model.</div></section>
          </div>
          <section className="panel alerts-panel"><PanelTitle title="Recent generated alerts" subtitle="Events created by demo scenarios" action={<button className="text-button" onClick={()=>setPage('alerts')}>View all alerts →</button>}/><AlertTable alerts={alerts.slice(0,4)} onAck={acknowledge}/></section>
        </>}

        {page==='people' && <section className="panel"><PanelTitle title="Demo people" subtitle="Select a fictional profile to explore changing simulated values"/><div className="people-grid">{people.map(p=><button className={`people-card ${selected===p.id?'selected':''}`} key={p.id} onClick={()=>{setSelected(p.id);setPose(p.pose||'standing')}}><div className="people-card-top"><div className="avatar person-avatar">{p.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><span className="risk-tag" style={{color:riskColor[p.risk],background:`${riskColor[p.risk]}16`}}>{p.risk}</span></div><h3>{p.name}</h3><p>{p.id} · {p.ageGroup}</p><PoseFigure pose={p.pose||'standing'}/><div className="people-vitals"><span><HeartPulse size={15}/>{p.heartRate} bpm</span><span><Wind size={15}/>{p.breathingRate}/min</span></div><div className="people-card-bottom"><span>Heuristic score</span><b>{p.riskScore}/100</b></div></button>)}</div></section>}

        {page==='signal' && <><div className="two-col"><section className="panel chart-panel"><PanelTitle title="Synthetic CSI-like waveform" subtitle="Generated amplitude samples · not captured from a WiFi device"/><div className="chart-wrap signal-chart"><Line data={signalData} options={{...lineOptions,plugins:{legend:{display:true}}}}/></div><div className="signal-caption"><span><i className="legend-line purple"/> Synthetic amplitude</span><span>50 generated samples</span></div></section><section className="panel"><PanelTitle title="Signal processing pipeline" subtitle="Illustrative software stages"/><div className="pipeline">{[['01','Synthetic signal generation','Creates a CSI-like array'],['02','Pre-processing','Mean-centering and scale normalization'],['03','Feature extraction','Mean, standard deviation, energy, zero-crossing rate'],['04','Heuristic scoring','Maps scenario features to a demo risk score'],['05','Dashboard & alerts','Persists generated observation and any alert']].map(s=><div className="pipeline-step" key={s[0]}><div>{s[0]}</div><section><b>{s[1]}</b><p>{s[2]}</p></section><Check size={16}/></div>)}</div></section></div><div className="metric-grid feature-grid"><Metric icon={<Waves/>} label="Signal mean" value={fmt(lastAnalysis?.features?.mean,3)} sub="Synthetic samples" tone="purple"/><Metric icon={<Activity/>} label="Signal standard deviation" value={fmt(lastAnalysis?.features?.std,3)} sub="Synthetic samples" tone="blue"/><Metric icon={<Zap/>} label="Signal energy" value={fmt(lastAnalysis?.features?.energy,2)} sub="Relative units" tone="amber"/><Metric icon={<BrainCircuit/>} label="Heuristic model score" value={`${lastAnalysis?.riskScore??activePerson?.riskScore??0}/100`} sub="Not a trained model" tone="green"/></div><section className="panel"><PanelTitle title="Analysis summary" subtitle="Latest selected profile analysis"/><div className="analysis-summary"><div><small>Scenario</small><b>{lastAnalysis?.scenario||'No new scenario yet'}</b></div><div><small>Pose</small><b>{lastAnalysis?.pose||pose}</b></div><div><small>Generated label</small><b>{lastAnalysis?.risk||risk}</b></div><div><small>Analysis engine</small><b>{lastAnalysis?.engine||'Python heuristic / fallback'}</b></div></div><p className="muted small-note">This pipeline is designed to demonstrate the architecture only. Actual CSI acquisition and scientifically validated estimation are not implemented.</p></section></>}

        {page==='alerts' && <section className="panel"><PanelTitle title="Alert history" subtitle="Simulated risk events stored by the backend" action={<span className="count-badge">{alerts.length} events</span>}/><AlertTable alerts={alerts} onAck={acknowledge}/></section>}
        <footer><div className="footer-brand"><Waves size={17}/> AirPulse+</div><span>Academic demo build · All readings are simulated</span><span>React · Node.js · Python FastAPI</span></footer>
      </div>
    </main>
    {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
  </div>;
}

function Metric({icon,label,value,sub,tone}) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{React.cloneElement(icon,{size:20})}</div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div>; }
function PanelTitle({title,subtitle,action}) { return <div className="panel-title"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>; }
function Vital({icon,name,value,unit,tone}) { return <div className="vital-card"><div className={`vital-icon ${tone}`}>{React.cloneElement(icon,{size:18})}</div><span>{name}</span><div><b>{value}</b><small>{unit}</small></div></div>; }
function LegendDot({color,label,value}) { return <div className="legend-row"><span className="legend-dot" style={{background:color}}/><span>{label}</span><b>{value}</b></div>; }
function PoseFigure({pose='standing'}) { return <div className={`pose-stage pose-${pose}`} aria-label={`Illustration of a person in ${pose} pose`}><div className="pose-glow"/><div className="human"><i className="head"/><i className="torso"/><i className="arm arm-left"/><i className="arm arm-right"/><i className="leg leg-left"/><i className="leg leg-right"/></div><span className="pose-caption">{pose.toUpperCase()} · SIMULATION</span></div>; }
function AlertTable({alerts,onAck}) { if(!alerts.length) return <div className="empty-state"><div><Bell size={22}/></div><b>No generated alerts yet</b><p>Run an irregular or fall simulation to create a demo event.</p></div>; return <div className="table-scroll"><table className="alerts-table"><thead><tr><th>EVENT</th><th>PROFILE</th><th>SCENARIO</th><th>RISK</th><th>TIME</th><th>STATUS</th><th></th></tr></thead><tbody>{alerts.map(a=><tr key={a.id}><td><div className="event-cell"><span className={`event-icon ${a.risk?.toLowerCase()}`}><AlertTriangle size={15}/></span><div><b>{a.title||`${a.risk} demo event`}</b><small>{a.message||'Generated simulation alert'}</small></div></div></td><td>{a.personName||a.personId}</td><td>{a.scenario}</td><td><span className={`risk-tag ${a.risk?.toLowerCase()}`}>{a.risk}</span></td><td>{a.timeLabel||a.createdAt||'—'}</td><td><span className={`status-tag ${a.acknowledged?'done':'pending'}`}>{a.acknowledged?'Acknowledged':'Needs review'}</span></td><td>{!a.acknowledged&&<button className="ack-button" onClick={()=>onAck(a.id)}>Acknowledge</button>}</td></tr>)}</tbody></table></div>; }
