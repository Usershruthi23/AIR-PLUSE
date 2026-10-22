# AirPulse+ — AI/ML Full-Stack Academic Prototype

**Project theme:** Contactless vital-sign estimation research concept using WiFi Channel State Information (CSI).

## Important scientific limitation
This deliverable is a **software simulation / academic demonstration**. It does **not** access a WiFi adapter, collect actual CSI packets, estimate real human vital signs, or detect real falls. Heart rate, breathing rate, CSI-like arrays, model scores, confidence values, and alerts are simulated. The AI/ML module uses a transparent heuristic scoring model over synthetic features, not a trained clinical model. Do not use this system for diagnosis, emergency response, or real patient monitoring.

## Architecture
- **React + Vite dashboard** (`client/`) — interactive dashboard, people, poses, signal lab, alerts.
- **Node.js + Express API** (`server/`) — REST API, validation, SQLite persistence, and integration with Python service.
- **Python + FastAPI signal/ML service** (`python_service/`) — synthetic CSI-like signal generation, signal-processing features (mean, standard deviation, energy, zero-crossing rate), and explainable heuristic risk score.
- **SQLite** — local demo data storage. Cloud database is optional and not required.

## Requirements
- Node.js 20 LTS recommended (18+ may work)
- npm
- Python 3.10+ (3.11 recommended)
- Internet connection for installing dependencies and loading Chart.js CDN in browser

## Run on Windows / VS Code
Use **two terminals** (three if you want to start the Python service separately).

### 1) Install JavaScript dependencies
From the project root:
```bash
npm install
npm run install:all
```

### 2) Create Python environment and install FastAPI
From the project root:
```bash
cd python_service
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```
If `py` is unavailable, try `python -m venv .venv`.

### 3) Start Python signal service
In the activated `python_service` terminal:
```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```
API docs: http://127.0.0.1:8000/docs

### 4) Start Node API
Open a second terminal at project root:
```bash
npm run start
```
Node API: http://localhost:4000/api/health

### 5) Start React dashboard
Open a third terminal at project root:
```bash
npm run dev --prefix client
```
Open **http://localhost:5173**.

### Optional: start Node + React together
After Python is running, use this in a separate terminal instead of steps 4 and 5:
```bash
npm run dev
```
The root script starts Node and React together; the Python service still needs to be running separately.

## Demo flow
1. Open the dashboard and select a demo person.
2. Choose a scenario such as Normal, Irregular Pattern, Inactivity, or Fall Simulation.
3. Click **Run simulation**.
4. Observe the generated simulated readings, risk score, synthetic signal chart, and any demo alert.
5. Open Alerts to acknowledge an alert.
6. Use Reset demo to restore the seed people and clear alert/history records.

## REST endpoints (Node API on port 4000)
- `GET /api/health`
- `GET /api/people`
- `GET /api/people/:id`
- `GET /api/alerts`
- `GET /api/history?personId=P001`
- `POST /api/simulate` JSON: `{"personId":"P001","scenario":"normal","pose":"standing"}`
- `POST /api/alerts/:id/acknowledge`
- `POST /api/reset`

Python service:
- `GET /health`
- `POST /analyze` JSON: `{"scenario":"normal","pose":"standing","personId":"P001"}`

## TensorFlow / PyTorch note
TensorFlow and PyTorch are intentionally **not required** to run this demo. The Python service shows the signal-processing and explainable ML-style pipeline with deterministic heuristics so it runs on a typical student laptop without a model download. You can later replace `score_risk()` in `python_service/app.py` with a trained TensorFlow/PyTorch model after collecting ethically sourced, validated data. Do not describe the heuristic as a trained neural network.

## Raspberry Pi / ESP32 / real CSI (optional future work)
These are not required. Real CSI capture requires compatible WiFi hardware, firmware/driver support, lawful/ethical data collection, calibration, and validated signal-processing methods. This project does not include hardware capture drivers.

## Troubleshooting
- **Port in use:** close the other process or change the port in `server/server.js`, `client/vite.config.js`, or the uvicorn command.
- **Python command not found:** install Python 3.10+ and enable PATH, then reopen VS Code.
- **Python analysis unavailable:** ensure FastAPI is running at `http://127.0.0.1:8000`. Node returns a clearly labeled fallback simulated analysis if it cannot reach Python.
- **Blank frontend:** check the Vite terminal and open http://localhost:5173 directly.
