import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'airpulse.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, ageGroup TEXT NOT NULL,
  heartRate INTEGER NOT NULL, breathingRate INTEGER NOT NULL,
  motionIndex REAL NOT NULL, pose TEXT NOT NULL, risk TEXT NOT NULL,
  riskScore INTEGER NOT NULL, updatedAt TEXT NOT NULL, latestAnalysis TEXT
);
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, personId TEXT NOT NULL,
  heartRate INTEGER NOT NULL, breathingRate INTEGER NOT NULL, motionIndex REAL NOT NULL,
  pose TEXT NOT NULL, scenario TEXT NOT NULL, risk TEXT NOT NULL, riskScore INTEGER NOT NULL,
  signal TEXT NOT NULL, features TEXT NOT NULL, engine TEXT NOT NULL, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, personId TEXT NOT NULL, personName TEXT NOT NULL,
  title TEXT NOT NULL, message TEXT NOT NULL, scenario TEXT NOT NULL, risk TEXT NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL
);`);

export const seedPeople = [
  {id:'P001',name:'Maya Chen',ageGroup:'Adult · 28',heartRate:72,breathingRate:15,motionIndex:0.42,pose:'standing',risk:'LOW',riskScore:12},
  {id:'P002',name:'Arjun Rao',ageGroup:'Child · 12',heartRate:88,breathingRate:19,motionIndex:0.58,pose:'sitting',risk:'LOW',riskScore:18},
  {id:'P003',name:'Elena Brooks',ageGroup:'Older adult · 68',heartRate:68,breathingRate:14,motionIndex:0.24,pose:'standing',risk:'LOW',riskScore:9},
  {id:'P004',name:'Noah Patel',ageGroup:'Adult · 42',heartRate:78,breathingRate:16,motionIndex:0.37,pose:'sitting',risk:'LOW',riskScore:15}
];
const count = db.prepare('SELECT COUNT(*) n FROM people').get().n;
if (!count) {
  const insert = db.prepare(`INSERT INTO people (id,name,ageGroup,heartRate,breathingRate,motionIndex,pose,risk,riskScore,updatedAt,latestAnalysis) VALUES (@id,@name,@ageGroup,@heartRate,@breathingRate,@motionIndex,@pose,@risk,@riskScore,@updatedAt,NULL)`);
  const tx = db.transaction(() => seedPeople.forEach(p => insert.run({...p, updatedAt:new Date().toISOString()})));
  tx();
}
export default db;
