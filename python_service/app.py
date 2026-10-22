"""Synthetic signal-processing / heuristic-risk service for the AirPulse+ demo.

This module does NOT capture real WiFi CSI and does NOT measure real people.
"""
from typing import Literal
import math
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="AirPulse+ Synthetic Signal Service",
    description="Academic demo only: generated CSI-like samples and heuristic risk scores; no real CSI acquisition.",
    version="1.0.0",
)

Scenario = Literal["normal", "irregular", "inactivity", "fall"]
Pose = Literal["standing", "sitting", "lying", "fallen"]

class AnalyzeRequest(BaseModel):
    scenario: Scenario = "normal"
    pose: Pose = "standing"
    personId: str = Field(default="P001", min_length=1, max_length=20)

def make_synthetic_signal(scenario: str, pose: str, seed: int) -> np.ndarray:
    """Generate illustrative samples; these are not measured CSI."""
    rng = np.random.default_rng(seed)
    t = np.linspace(0, 6 * math.pi, 128)
    amplitude = 0.20 if scenario == "inactivity" else 0.45
    if scenario == "irregular":
        wave = 0.32 * np.sin(1.4 * t) + 0.20 * np.sin(3.8 * t)
    elif scenario == "fall" or pose == "fallen":
        wave = 0.12 * np.sin(0.45 * t) + np.exp(-0.5 * ((t - 8) / 0.45) ** 2) * 0.9
    else:
        wave = amplitude * np.sin(t) + 0.12 * np.sin(0.35 * t)
    noise = rng.normal(0, 0.055 if scenario != "inactivity" else 0.018, size=t.shape)
    signal = wave + noise
    # Mean-centering is a simple illustrative pre-processing step.
    signal = signal - np.mean(signal)
    return signal

def extract_features(signal: np.ndarray) -> dict:
    centered = signal - np.mean(signal)
    std = float(np.std(centered))
    crossings = np.where(np.diff(np.signbit(centered)))[0]
    return {
        "mean": round(float(np.mean(signal)), 5),
        "std": round(std, 5),
        "energy": round(float(np.sum(centered ** 2)), 4),
        "zeroCrossingRate": round(float(len(crossings) / max(1, len(signal) - 1)), 4),
        "sampleCount": int(len(signal)),
    }

def score_risk(scenario: str, pose: str, features: dict) -> tuple[str, int]:
    """Transparent scenario-rule score; not a trained ML model."""
    if scenario == "fall" or pose == "fallen":
        return "CRITICAL", 96
    if scenario == "irregular":
        return "HIGH", 76
    if scenario == "inactivity" or pose == "lying":
        return "MEDIUM", 44
    # Slightly vary the baseline based on synthetic signal energy.
    score = min(25, max(7, int(8 + features["energy"] * 0.15)))
    return "LOW", score

@app.get("/health")
def health():
    return {"status": "ok", "service": "python-signal-demo", "simulationOnly": True}

@app.post("/analyze")
def analyze(payload: AnalyzeRequest):
    seed = sum(ord(c) for c in payload.personId + payload.scenario + payload.pose)
    signal = make_synthetic_signal(payload.scenario, payload.pose, seed)
    features = extract_features(signal)
    risk, score = score_risk(payload.scenario, payload.pose, features)
    return {
        "personId": payload.personId,
        "scenario": payload.scenario,
        "pose": payload.pose,
        "risk": risk,
        "riskScore": score,
        "confidence": 0.62,
        "signal": [round(float(x), 5) for x in signal[:50]],
        "features": features,
        "engine": "Python signal features + transparent heuristic rules",
        "simulated": True,
        "disclaimer": "Synthetic data only; no actual WiFi CSI or vital signs are measured."
    }
