import express from 'express';
import cors from 'cors';
import db, { seedPeople } from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const allowedScenarios = new Set(['normal','irregular','inactivity','fall']);
const allowedPoses = new Set(['standing','sitting','lying','fallen']);
const now = () => new Date().toISOString();
const timeLabel = (v) => new Date(v).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
function parsePerson(row) {
  if (!row) return null;
  return {...row, latestAnalysis: row.latestAnalysis ? JSON.parse(row.latestAnalysis) : null};
}
function listPeople() {
  return db.prepare('SELECT * FROM people ORDER BY id').all().map(parsePerson);
}
function getPerson(id) { return parsePerson(db.prepare('SELECT * FROM people WHERE id=?').get(id)); }
function fallbackAnalysis(scenario, pose) {
  const risk = scenario === 'fall' || pose === 'fallen' ? 'CRITICAL' : scenario === 'irregular' ? 'HIGH' : scenario === 'inactivity' ? 'MEDIUM' : 'LOW';
  const riskScore = {LOW:12,MEDIUM:44,HIGH:76,CRITICAL:96}[risk];
  const signal = Array.from({length:50},(_,i)=>Number((Math.sin(i*.42)*.45 + Math.cos(i*.16)*.18 + (scenario==='irregular'?Math.sin(i*1.6)*.22:0)).toFixed(4)));
  const mean = signal.reduce((a,b)=>a+b,0)/signal.length;
  const std = Math.sqrt(signal.reduce((a,b)=>a+(b-mean)**2,0)/signal.length);
  return {risk,riskScore,signal,features:{mean,std,energy:signal.reduce((a,b)=>a+b*b,0),zeroCrossingRate:0.18},scenario,pose,engine:'Node fallback heuristic',confidence:0.62,simulated:true};
}
async function analyze(scenario, pose, personId) {
  try {
    const r = await fetch(`${PYTHON_URL}/analyze`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario,pose,personId}),signal:AbortSignal.timeout(2500)});
    if (r.ok) return await r.json();
  } catch {}
  return fallbackAnalysis(scenario, pose);
}
function riskVitals(scenario, pose, personId) {
  const base = {P001:[72,15],P002:[88,19],P003:[68,14],P004:[78,16]}[personId] || [75,16];
  let hr=base[0], br=base[1], motion=.4;
  if (scenario==='irregular') { hr+=Math.round(15+Math.random()*8); br+=Math.round(5+Math.random()*3); motion=.76; }
  else if (scenario==='inactivity') { hr-=Math.round(2+Math.random()*4); br-=1; motion=.05; }
  else if (scenario==='fall') { hr+=Math.round(10+Math.random()*10); br+=Math.round(3+Math.random()*4); motion=.02; }
  else { hr+=Math.round(Math.random()*4-2); br+=Math.round(Math.random()*2-1); motion=.25+Math.random()*.3; }
  if (pose==='fallen') motion=.02;
  return {heartRate:Math.max(48,hr),breathingRate:Math.max(8,br),motionIndex:Number(motion.toFixed(2))};
}
app.get('/api/health', (req,res) => {
  res.json({status:'ok',service:'AirPulse+ API',simulationOnly:true,pythonService:process.env.PYTHON_SERVICE_URL ? true : 'local-or-fallback',timestamp:now()});
});
app.get('/api/people', (req,res) => res.json(listPeople()));
app.get('/api/people/:id', (req,res) => {
  const p=getPerson(req.params.id);
  if (!p) return res.status(404).json({error:'Demo profile not found'});
  res.json(p);
});
app.get('/api/alerts', (req,res) => {
  const rows=db.prepare('SELECT * FROM alerts ORDER BY id DESC LIMIT 200').all();
  res.json(rows.map(a=>({...a,acknowledged:Boolean(a.acknowledged),timeLabel:timeLabel(a.createdAt)})));
});
app.get('/api/history', (req,res) => {
  const {personId}=req.query;
  const rows=personId
    ? db.prepare('SELECT * FROM readings WHERE personId=? ORDER BY id ASC LIMIT 100').all(personId)
    : db.prepare('SELECT * FROM readings ORDER BY id ASC LIMIT 100').all();
  res.json(rows.map(r=>({...r,signal:JSON.parse(r.signal),features:JSON.parse(r.features),timeLabel:timeLabel(r.createdAt)})));
});
app.post('/api/simulate', async (req,res) => {
  const {personId,scenario='normal',pose='standing'}=req.body || {};
  if (!personId || !getPerson(personId)) return res.status(400).json({error:'Select a valid demo profile'});
  if (!allowedScenarios.has(scenario)) return res.status(400).json({error:'Unsupported scenario'});
  if (!allowedPoses.has(pose)) return res.status(400).json({error:'Unsupported pose'});
  const person=getPerson(personId);
  const analysis=await analyze(scenario,pose,personId);
  const vitals=riskVitals(scenario,pose,personId);
  const risk=analysis.risk || 'LOW';
  const riskScore=Math.max(0,Math.min(100,Number(analysis.riskScore)||0));
  const createdAt=now();
  const savedAnalysis={...analysis,scenario,pose,risk,riskScore,simulated:true};
  const update=db.prepare('UPDATE people SET heartRate=?,breathingRate=?,motionIndex=?,pose=?,risk=?,riskScore=?,updatedAt=?,latestAnalysis=? WHERE id=?');
  update.run(vitals.heartRate,vitals.breathingRate,vitals.motionIndex,pose,risk,riskScore,createdAt,JSON.stringify(savedAnalysis),personId);
  db.prepare(`INSERT INTO readings (personId,heartRate,breathingRate,motionIndex,pose,scenario,risk,riskScore,signal,features,engine,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(personId,vitals.heartRate,vitals.breathingRate,vitals.motionIndex,pose,scenario,risk,riskScore,JSON.stringify(analysis.signal||[]),JSON.stringify(analysis.features||{}),analysis.engine||'Fallback heuristic',createdAt);
  if (['MEDIUM','HIGH','CRITICAL'].includes(risk)) {
    const title=scenario==='fall' || pose==='fallen' ? 'Fall scenario simulated' : scenario==='irregular' ? 'Irregular pattern simulated' : 'Inactivity scenario simulated';
    const message=`Generated ${risk.toLowerCase()} risk label for ${person.name}; this is a simulation, not a real detection.`;
    db.prepare('INSERT INTO alerts (personId,personName,title,message,scenario,risk,acknowledged,createdAt) VALUES (?,?,?,?,?,?,0,?)').run(personId,person.name,title,message,scenario,risk,createdAt);
  }
  res.json({person:getPerson(personId),analysis:savedAnalysis,reading:{...vitals,personId,pose,scenario,risk,riskScore,createdAt,timeLabel:timeLabel(createdAt)},simulated:true});
});
app.post('/api/alerts/:id/acknowledge', (req,res) => {
  const result=db.prepare('UPDATE alerts SET acknowledged=1 WHERE id=?').run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({error:'Alert not found'});
  res.json({success:true,id:Number(req.params.id),acknowledged:true});
});
app.post('/api/reset', (req,res) => {
  const reset=db.transaction(() => {
    db.prepare('DELETE FROM readings').run();
    db.prepare('DELETE FROM alerts').run();
    const update=db.prepare(`UPDATE people SET name=@name,ageGroup=@ageGroup,heartRate=@heartRate,breathingRate=@breathingRate,motionIndex=@motionIndex,pose=@pose,risk=@risk,riskScore=@riskScore,updatedAt=@updatedAt,latestAnalysis=NULL WHERE id=@id`);
    seedPeople.forEach(p=>update.run({...p,updatedAt:now()}));
  });
  reset();
  res.json({success:true,simulationOnly:true});
});
app.listen(PORT,()=>console.log(`AirPulse+ Node API listening at http://localhost:${PORT}`));
