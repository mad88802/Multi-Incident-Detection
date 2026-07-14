# VisionAI — Multi-Hazard Detection Suite

A real-time AI detection platform with three modules, each powered by a **fine-tuned YOLOv11** model trained on its own dataset:

- **Fire & Smoke** — fine-tuned on a fire detection dataset (`best.pt`)
- **Garbage & Waste** — fine-tuned on a garbage/waste dataset
- **Accident & Traffic Hazards** — fine-tuned on an accident/traffic hazards dataset

Built with a **Flask** backend (Python) and a **React + Vite** frontend. The UI includes live webcam inference, drag-and-drop image upload, geolocation tagging, an operations dashboard, and detection statistics backed by SQLite.

---

## Project Structure

```
fire_detection/
├── backend/
│   ├── app.py              # Flask API (YOLO inference, event storage, SPA serving)
│   ├── best.pt             # YOLOv11 fire/smoke weights (not in git — see below)
│   ├── events.db           # SQLite database for detection events
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Root layout, routing, health check
│   │   ├── index.css                   # Design system and styles
│   │   └── components/
│   │       ├── HomePage.jsx            # Landing page and module selection
│   │       ├── DashboardPage.jsx       # Operations center with stats and map
│   │       ├── DetectionModule.jsx     # Tab container per detection type
│   │       ├── UploadTab.jsx           # Drag-and-drop image upload
│   │       ├── WebcamTab.jsx           # Live webcam inference (~600 ms polling)
│   │       ├── StatsTab.jsx            # Per-module detection history
│   │       ├── DetectionResults.jsx    # Annotated image and detection list
│   │       ├── MapPanel.jsx            # Leaflet map for pinning incident location
│   │       └── AlertToast.jsx          # Global alert notifications
│   ├── index.html
│   ├── vite.config.js      # Vite dev server with /api proxy to :5001
│   └── package.json
├── start_backend.bat       # Build frontend + start backend (Windows)
└── README.md
```

---

## Prerequisites

- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **YOLOv11 model weights** — place trained weights in the `backend/` folder (gitignored; must be supplied separately)

---

## Getting Started

### Quick start (production mode)

Double-click **`start_backend.bat`**. It will:

1. Install npm dependencies and build the React frontend into `frontend/dist/`
2. Create a Python virtual environment and install backend dependencies
3. Start the Flask server at **http://localhost:5001**

The backend serves both the API and the built frontend, so you only need one process in production.

> First-time setup can take 1–2 minutes while PyTorch and Ultralytics are installed.

### Development mode (hot reload)

Run the backend and frontend separately for faster iteration:

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
python app.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

- API: **http://localhost:5001**
- Frontend (with HMR): **http://localhost:5173**

The Vite dev server proxies all `/api/*` requests to `http://localhost:5001` automatically.

---

## API Endpoints

### Detection

| Method | Endpoint               | Description                              |
|--------|------------------------|------------------------------------------|
| GET    | `/api/health`          | Server status and model availability     |
| POST   | `/api/detect/fire`     | YOLOv11 fire/smoke detection             |
| POST   | `/api/detect/garbage`  | YOLOv11 garbage/waste detection          |
| POST   | `/api/detect/accident` | YOLOv11 accident/hazard detection        |

All `POST` detection endpoints accept `multipart/form-data` with a `file` field (image).

**Response format:**
```json
{
  "success": true,
  "count": 2,
  "detections": [
    {
      "label": "fire",
      "confidence": 0.94,
      "bbox": [x1, y1, x2, y2],
      "color": "rgb(255,80,20)"
    }
  ],
  "annotated_img": "<base64-encoded JPEG>",
  "inference_ms": 142.3
}
```

### Events

| Method | Endpoint            | Description                                      |
|--------|---------------------|--------------------------------------------------|
| POST   | `/api/events`       | Save a detection event (with optional lat/lng)   |
| GET    | `/api/events`       | List recent events (`?module=fire&limit=200`)    |
| GET    | `/api/events/stats` | Summary stats, daily breakdown, and map pins     |

---

## Features

- **Three detection modules** — each with Upload, Live Webcam, and Statistics tabs
- **Live webcam inference** — frames sent to the backend every ~600 ms with bounding box overlay
- **Geolocation tagging** — pin incident location on a Leaflet map after a detection
- **Operations Center** — global dashboard with totals, daily charts, event feed, and map
- **Event persistence** — detections stored in SQLite (`backend/events.db`)
- **Alert toasts** — real-time notifications when hazards are detected
- **Module-aware theming** — Fire (orange), Garbage (teal), Accident (blue)
- **Model status indicator** — shows whether `best.pt` is loaded on the home page

---

## Model Info

All three detection modules are powered by **fine-tuned YOLOv11** models. Each module was trained on a dedicated dataset:

| Module   | Dataset                        | Detects                                                                 |
|----------|--------------------------------|-------------------------------------------------------------------------|
| Fire     | Fire detection dataset         | Active flames, smoke plumes, ignition sources                           |
| Garbage  | Garbage/waste dataset          | Plastic bottles, cardboard, organic waste, cans, and other waste types |
| Accident | Accident/traffic hazards dataset | Collisions, overturned vehicles, road debris, disabled vehicles, etc. |

### Fine-tuning

We fine-tuned **YOLOv11** separately on each of the three datasets above, producing one specialized model per hazard type. This gives each module its own optimized weights rather than a single general-purpose detector.

Place the trained weights in the `backend/` folder before starting the server (e.g. `best.pt` for the fire module). The home page status pill turns **green** when the fire model is loaded and available.

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Flask, Ultralytics YOLOv11, OpenCV, SQLite      |
| Frontend | React 19, Vite 8, Framer Motion, Axios          |
| Maps     | Leaflet (Carto dark tiles)                      |

---

## Building for Production

```bash
cd frontend
npm install
npm run build
```

Then start the backend — it serves the static build from `frontend/dist/`:

```bash
cd backend
python app.py
```

Or use `start_backend.bat` on Windows, which runs both steps automatically.
