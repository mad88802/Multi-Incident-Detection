# 🔥 VisionAI — Multi-Hazard Detection Suite

A real-time AI detection platform with three modules:
- **🔥 Fire & Smoke** — powered by a custom-trained YOLOv8 model (`best.pt`)
- **🗑️ Garbage & Waste** — simulated multi-class object detection
- **🚗 Accident & Traffic Hazards** — simulated collision & hazard detection

Built with a **Flask** backend (Python) and a **React + Vite** frontend with a dark, premium UI featuring live webcam inference, drag-and-drop image upload, and detection statistics.

---

## 📁 Project Structure

```
fire_detection/
├── backend/
│   ├── app.py              # Flask API server (YOLO + simulated detectors)
│   ├── best.pt             # YOLOv8 fire/smoke model weights
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Root layout, routing, health check
│   │   ├── index.css                   # Full design system & styles
│   │   └── components/
│   │       ├── Sidebar.jsx             # Navigation sidebar
│   │       ├── DashboardOverview.jsx   # Main dashboard with camera matrix
│   │       ├── DetectionModule.jsx     # Tab container per detection type
│   │       ├── UploadTab.jsx           # Drag-and-drop image upload
│   │       ├── WebcamTab.jsx           # Live webcam inference (600ms polling)
│   │       ├── StatsTab.jsx            # Detection history & statistics
│   │       ├── DetectionResults.jsx    # Annotated image + detection list
│   │       ├── ParticleBackground.jsx  # Animated canvas particles
│   │       └── ComingSoon.jsx          # Placeholder component
│   ├── index.html
│   ├── vite.config.js       # Vite dev server with /api proxy to :5001
│   └── package.json
├── start_backend.bat        # One-click backend launch (Windows)
├── start_frontend.bat       # One-click frontend launch (Windows)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+** with pip
- **Node.js 18+** with npm

### 1. Start the Backend

**Option A — Double-click** `start_backend.bat` (auto-creates venv, installs deps, starts server)

**Option B — Manual:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app.py
```
The API will be available at **http://localhost:5001**

### 2. Start the Frontend

**Option A — Double-click** `start_frontend.bat` (installs npm deps, starts Vite)

**Option B — Manual:**
```bash
cd frontend
npm install
npm run dev
```
The app will open at **http://localhost:5173**

> The Vite dev server proxies all `/api/*` requests to `http://localhost:5001` automatically.

---

## 🔌 API Endpoints

| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/api/health`         | Check server status & model availability |
| POST   | `/api/detect/fire`    | Run YOLOv8 fire/smoke detection          |
| POST   | `/api/detect/garbage` | Run simulated garbage classification     |
| POST   | `/api/detect/accident`| Run simulated accident/hazard detection  |

All `POST` endpoints accept `multipart/form-data` with a `file` field (image).

**Response format:**
```json
{
  "success": true,
  "count": 2,
  "detections": [
    { "label": "fire", "confidence": 0.94, "bbox": [x1, y1, x2, y2], "color": "rgb(255,80,20)" }
  ],
  "annotated_img": "<base64-encoded JPEG>",
  "inference_ms": 142.3
}
```

---

## 🎨 Features

- **Dark premium UI** with glassmorphism cards and animated particle backgrounds
- **3 detection modules** — each with Upload, Live Webcam, and Statistics tabs
- **Live webcam inference** — frames sent to backend every 600ms with bounding box overlay
- **Per-module statistics** — detection count, average confidence, inference times, event log
- **Dashboard overview** — multi-camera feed simulation, threat level gauge, global alert feed
- **Module-aware theming** — Fire (orange), Garbage (teal), Accident (blue)
- **Backend model status indicator** in sidebar and topbar

---

## 🤖 Model Info

The fire & smoke detection uses a custom YOLOv8 model (`best.pt`) trained to detect:
- `fire` — active flames / ignition sources
- `smoke` — exhaust clouds, smoke plumes

Place `best.pt` in the `backend/` folder before starting the server. The sidebar indicator will turn **green** when the model is loaded successfully.
