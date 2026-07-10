import os
import io
import base64
import time
import sqlite3
import json
from datetime import datetime, timedelta
import cv2
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from ultralytics import YOLO

# ── Static files (React build) ─────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend", "dist")
DB_PATH      = os.path.join(BASE_DIR, "events.db")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="/")
CORS(app)

# ── Database ───────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                module       TEXT    NOT NULL,
                labels       TEXT    NOT NULL,
                confidence   REAL    NOT NULL,
                inference_ms REAL    NOT NULL,
                count        INTEGER NOT NULL DEFAULT 0,
                latitude     REAL,
                longitude    REAL,
                timestamp    TEXT    NOT NULL
            )
        """)
        conn.commit()

init_db()

# ── Model Loading ──────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")
model = None

def get_model():
    global model
    if model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at: {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
    return model

# ── Colour palette for classes ─────────────────────────────────────────────────
CLASS_COLORS = {
    "fire":  (255, 80,  20),
    "smoke": (180, 180, 180),
}

def get_color(label: str):
    label_lower = label.lower()
    for key, color in CLASS_COLORS.items():
        if key in label_lower:
            return color
    return (255, 165, 0)

# ── Inference helper ───────────────────────────────────────────────────────────
def run_inference(image_bytes: bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    mdl     = get_model()
    results = mdl(img, verbose=False)[0]

    detections = []
    for box in results.boxes:
        conf  = float(box.conf[0])
        cls   = int(box.cls[0])
        label = mdl.names[cls]
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        color = get_color(label)

        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        text  = f"{label} {conf:.0%}"
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(img, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
        cv2.putText(img, text, (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

        detections.append({
            "label":      label,
            "confidence": round(conf, 4),
            "bbox":       [x1, y1, x2, y2],
            "color":      f"rgb({color[0]},{color[1]},{color[2]})"
        })

    _, buffer  = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    img_b64    = base64.b64encode(buffer).decode("utf-8")
    return img_b64, detections

# ── Simulated Detection Helpers ───────────────────────────────────────────────
def simulate_detection(image_bytes: bytes, target_type: str):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    h, w, _ = img.shape

    if target_type == "garbage":
        classes = ["plastic bottle", "cardboard box", "paper cup", "organic waste", "aluminum can"]
        colors = {
            "plastic bottle": (0, 200, 150),
            "cardboard box": (0, 180, 220),
            "paper cup": (120, 200, 100),
            "organic waste": (80, 140, 80),
            "aluminum can": (0, 220, 180)
        }
    else:
        classes = ["collision", "overturned vehicle", "car scratch", "road debris", "disabled vehicle"]
        colors = {
            "collision": (0, 100, 255),
            "overturned vehicle": (50, 50, 255),
            "car scratch": (100, 150, 255),
            "road debris": (200, 100, 255),
            "disabled vehicle": (0, 180, 255)
        }

    np.random.seed(int((h * w) % 9999))
    num_detections = np.random.randint(1, 4)

    detections = []
    for _ in range(num_detections):
        label = np.random.choice(classes)
        conf = float(np.random.uniform(0.65, 0.96))

        bw = np.random.randint(int(w * 0.15), int(w * 0.4))
        bh = np.random.randint(int(h * 0.15), int(h * 0.4))
        x1 = np.random.randint(0, w - bw)
        y1 = np.random.randint(0, h - bh)
        x2, y2 = x1 + bw, y1 + bh

        color = colors.get(label, (0, 255, 0))
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        text = f"{label} {conf:.0%}"
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(img, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
        cv2.putText(img, text, (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

        detections.append({
            "label": label,
            "confidence": round(conf, 4),
            "bbox": [x1, y1, x2, y2],
            "color": f"rgb({color[0]},{color[1]},{color[2]})"
        })

    _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    img_b64 = base64.b64encode(buffer).decode("utf-8")
    return img_b64, detections

# ── Detection Routes ───────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    model_ready = os.path.exists(MODEL_PATH)
    return jsonify({"status": "ok", "model_ready": model_ready, "model_path": MODEL_PATH})


@app.route("/api/detect/fire", methods=["POST"])
def detect_fire():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file        = request.files["file"]
    image_bytes = file.read()
    try:
        t0             = time.time()
        img_b64, dets  = run_inference(image_bytes)
        elapsed        = round((time.time() - t0) * 1000, 1)
        return jsonify({
            "success": True, "detections": dets,
            "annotated_img": img_b64, "inference_ms": elapsed, "count": len(dets)
        })
    except FileNotFoundError as e:
        return jsonify({"error": str(e), "hint": "Place best.pt in the backend/ folder"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/detect/garbage", methods=["POST"])
def detect_garbage():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file        = request.files["file"]
    image_bytes = file.read()
    try:
        t0 = time.time()
        img_b64, dets = simulate_detection(image_bytes, "garbage")
        elapsed = round((time.time() - t0) * 1000, 1)
        return jsonify({
            "success": True, "detections": dets,
            "annotated_img": img_b64, "inference_ms": elapsed, "count": len(dets)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/detect/accident", methods=["POST"])
def detect_accident():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file        = request.files["file"]
    image_bytes = file.read()
    try:
        t0 = time.time()
        img_b64, dets = simulate_detection(image_bytes, "accident")
        elapsed = round((time.time() - t0) * 1000, 1)
        return jsonify({
            "success": True, "detections": dets,
            "annotated_img": img_b64, "inference_ms": elapsed, "count": len(dets)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Event Storage Routes ───────────────────────────────────────────────────────
@app.route("/api/events", methods=["POST"])
def save_event():
    """Save a detected incident to the database."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body"}), 400

    module       = data.get("module", "unknown")
    labels       = json.dumps(data.get("labels", []))
    confidence   = float(data.get("confidence", 0))
    inference_ms = float(data.get("inference_ms", 0))
    count        = int(data.get("count", 0))
    latitude     = data.get("latitude")
    longitude    = data.get("longitude")
    timestamp    = datetime.utcnow().isoformat()

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO events (module, labels, confidence, inference_ms, count, latitude, longitude, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (module, labels, confidence, inference_ms, count, latitude, longitude, timestamp)
        )
        event_id = cursor.lastrowid
        conn.commit()

    return jsonify({
        "success": True,
        "event": {
            "id": event_id, "module": module,
            "labels": data.get("labels", []),
            "confidence": confidence, "inference_ms": inference_ms,
            "count": count, "latitude": latitude, "longitude": longitude,
            "timestamp": timestamp
        }
    }), 201


@app.route("/api/events", methods=["GET"])
def get_events():
    """Return the last 200 events, newest first."""
    module_filter = request.args.get("module")
    limit         = int(request.args.get("limit", 200))

    with get_db() as conn:
        if module_filter:
            rows = conn.execute(
                "SELECT * FROM events WHERE module=? ORDER BY id DESC LIMIT ?",
                (module_filter, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()

    events = []
    for row in rows:
        events.append({
            "id": row["id"],
            "module": row["module"],
            "labels": json.loads(row["labels"]),
            "confidence": row["confidence"],
            "inference_ms": row["inference_ms"],
            "count": row["count"],
            "latitude": row["latitude"],
            "longitude": row["longitude"],
            "timestamp": row["timestamp"],
        })
    return jsonify({"events": events, "total": len(events)})


@app.route("/api/events/stats", methods=["GET"])
def get_event_stats():
    """Return summary stats: per-module counts, today total, last-7-days breakdown, map pins."""
    today    = datetime.utcnow().date().isoformat()
    week_ago = (datetime.utcnow() - timedelta(days=6)).date().isoformat()

    with get_db() as conn:
        module_rows = conn.execute(
            "SELECT module, COUNT(*) as cnt FROM events GROUP BY module"
        ).fetchall()

        today_row = conn.execute(
            "SELECT COUNT(*) as cnt FROM events WHERE timestamp >= ?", (today,)
        ).fetchone()

        total_row = conn.execute("SELECT COUNT(*) as cnt FROM events").fetchone()

        daily_rows = conn.execute(
            """SELECT substr(timestamp,1,10) as day, COUNT(*) as cnt
               FROM events WHERE substr(timestamp,1,10) >= ?
               GROUP BY day ORDER BY day""",
            (week_ago,)
        ).fetchall()

        map_rows = conn.execute(
            "SELECT id, module, labels, confidence, latitude, longitude, timestamp FROM events WHERE latitude IS NOT NULL"
        ).fetchall()

    return jsonify({
        "total": total_row["cnt"],
        "today": today_row["cnt"],
        "by_module": {row["module"]: row["cnt"] for row in module_rows},
        "daily": [{"day": r["day"], "count": r["cnt"]} for r in daily_rows],
        "map_events": [
            {
                "id": r["id"], "module": r["module"],
                "labels": json.loads(r["labels"]),
                "confidence": r["confidence"],
                "latitude": r["latitude"], "longitude": r["longitude"],
                "timestamp": r["timestamp"]
            } for r in map_rows
        ]
    })


# ── Serve React SPA ───────────────────────────────────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    """Serve the React build; fall back to index.html for client-side routing."""
    full_path = os.path.join(FRONTEND_DIR, path)
    if path and os.path.exists(full_path):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")


if __name__ == "__main__":
    print("🔥 VisionAI Detection API starting on http://localhost:5001")
    print(f"📦 Serving frontend from: {os.path.abspath(FRONTEND_DIR)}")
    print(f"🗄️  Events database: {os.path.abspath(DB_PATH)}")
    app.run(debug=False, host="0.0.0.0", port=5001)
