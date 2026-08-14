import uuid
import shutil
import time
import subprocess
import cv2
import numpy as np
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(title="CrackScope API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR          = Path(__file__).parent
UPLOADS_DIR       = BASE_DIR / "uploads"
OUTPUTS_DIR       = BASE_DIR / "outputs"
RESULTS_DIR       = BASE_DIR.parent.parent / "Result"
CRACK_MODEL_PATH  = RESULTS_DIR / "Wall crack dataset result" / "best.pt"
WINDOW_MODEL_PATH = RESULTS_DIR / "window data set results"  / "best.pt"

UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUTS_DIR.mkdir(exist_ok=True)

# ── Load both models ───────────────────────────────────────────────────────────
print(f"Loading crack  model: {CRACK_MODEL_PATH}")
crack_model  = YOLO(str(CRACK_MODEL_PATH))

print(f"Loading window model: {WINDOW_MODEL_PATH}")
window_model = YOLO(str(WINDOW_MODEL_PATH))

print("Both models loaded.")

# ── Colors (BGR) ───────────────────────────────────────────────────────────────
COLORS = {
    "wallcrack": (0,  80, 255),
    "window":    (0, 200,  80),
}

# ── Helpers ────────────────────────────────────────────────────────────────────
def crack_severity(x1, y1, x2, y2, img_h, img_w) -> str:
    area = (x2 - x1) * (y2 - y1) / (img_w * img_h)
    if area < 0.01:  return "minor"
    if area < 0.05:  return "moderate"
    return "severe"


def run_both_models(image: np.ndarray, conf: float = 0.25) -> list:
    detections = []
    img_h, img_w = image.shape[:2]

    for r in crack_model(image, conf=conf, verbose=False):
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            detections.append({
                "class":      "wallcrack",
                "confidence": round(float(box.conf[0]), 3),
                "severity":   crack_severity(x1, y1, x2, y2, img_h, img_w),
                "bbox":       [x1, y1, x2, y2],
            })

    for r in window_model(image, conf=conf, verbose=False):
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            detections.append({
                "class":      "window",
                "confidence": round(float(box.conf[0]), 3),
                "severity":   None,
                "bbox":       [x1, y1, x2, y2],
            })

    return detections


def draw_detections(image: np.ndarray, detections: list) -> np.ndarray:
    for d in detections:
        x1, y1, x2, y2 = d["bbox"]
        label = d["class"]
        conf  = d["confidence"]
        sev   = d.get("severity")
        color = COLORS.get(label, (255, 180, 0))

        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)

        display = f"{label} {conf:.2f}" + (f" [{sev}]" if sev else "")
        (tw, th), _ = cv2.getTextSize(display, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(image, (x1, y1 - th - 8), (x1 + tw + 6, y1), color, -1)
        cv2.putText(image, display, (x1 + 3, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    return image


def cleanup_old_files():
    cutoff = time.time() - 3600  # 1 hour
    for folder in [UPLOADS_DIR, OUTPUTS_DIR]:
        for f in folder.iterdir():
            try:
                if f.stat().st_mtime < cutoff:
                    f.unlink()
            except Exception:
                pass


# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    cleanup_old_files()


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "crack":  list(crack_model.names.values()),
            "window": list(window_model.names.values()),
        }
    }


@app.post("/detect/image")
async def detect_image(
    file: UploadFile = File(...),
    conf: float = Query(default=0.25, ge=0.1, le=0.9)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}:
        raise HTTPException(400, "Unsupported image format")

    uid      = uuid.uuid4().hex
    in_path  = UPLOADS_DIR / f"{uid}{ext}"
    out_path = OUTPUTS_DIR / f"{uid}_result.jpg"

    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    img = cv2.imread(str(in_path))
    if img is None:
        raise HTTPException(400, "Could not read image")

    detections = run_both_models(img, conf=conf)
    annotated  = draw_detections(img.copy(), detections)
    cv2.imwrite(str(out_path), annotated)

    counts = {}
    for d in detections:
        counts[d["class"]] = counts.get(d["class"], 0) + 1

    return JSONResponse({
        "type":             "image",
        "result_url":       f"/output/{out_path.name}",
        "total_detections": len(detections),
        "counts":           counts,
        "detections":       detections,
        "filename":         file.filename,
        "timestamp":        int(time.time()),
    })


@app.post("/detect/video")
async def detect_video(
    file: UploadFile = File(...),
    conf: float = Query(default=0.25, ge=0.1, le=0.9),
    frame_skip: int = Query(default=2, ge=1, le=10)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in {".mp4", ".avi", ".mov", ".mkv", ".webm"}:
        raise HTTPException(400, "Unsupported video format")

    uid      = uuid.uuid4().hex
    in_path  = UPLOADS_DIR / f"{uid}{ext}"
    out_path = OUTPUTS_DIR / f"{uid}_result.mp4"

    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    cap = cv2.VideoCapture(str(in_path))
    if not cap.isOpened():
        raise HTTPException(400, "Could not open video")

    fps    = cap.get(cv2.CAP_PROP_FPS) or 25
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(out_path), fourcc, fps, (width, height))

    all_detections = []
    frame_count    = 0
    last_dets      = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1

        if frame_count % frame_skip == 0:
            last_dets = run_both_models(frame, conf=conf)
            all_detections.extend(last_dets)

        annotated = draw_detections(frame.copy(), last_dets)
        writer.write(annotated)

    cap.release()
    writer.release()

    # Re-encode to H.264 using FFmpeg so browsers can play it natively
    h264_path = OUTPUTS_DIR / f"{uid}_result_h264.mp4"
    try:
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", str(out_path),
                "-vcodec", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                str(h264_path),
            ],
            check=True,
            capture_output=True,
        )
        out_path.unlink(missing_ok=True)   # remove the mp4v temp file
        out_path = h264_path               # use the H.264 file going forward
    except Exception as ffmpeg_err:
        # FFmpeg failed — fall back to mp4v file (download still works)
        print(f"FFmpeg re-encode failed: {ffmpeg_err}")

    counts = {}
    for d in all_detections:
        counts[d["class"]] = counts.get(d["class"], 0) + 1

    return JSONResponse({
        "type":             "video",
        "result_url":       f"/output/{out_path.name}",
        "total_frames":     frame_count,
        "total_detections": len(all_detections),
        "counts":           counts,
        "filename":         file.filename,
        "timestamp":        int(time.time()),
    })


@app.get("/output/{filename}")
def get_output(filename: str, request: Request):
    path = OUTPUTS_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")

    is_video = filename.lower().endswith(".mp4")
    media_type = "video/mp4" if is_video else "image/jpeg"

    # For images, simple FileResponse is fine
    if not is_video:
        return FileResponse(str(path), media_type=media_type)

    # For videos, support HTTP Range requests so browsers can stream & seek
    file_size = path.stat().st_size
    range_header = request.headers.get("range")

    if range_header:
        # Parse "bytes=start-end"
        range_val = range_header.strip().lower().replace("bytes=", "")
        parts = range_val.split("-")
        start = int(parts[0]) if parts[0] else 0
        end   = int(parts[1]) if parts[1] else file_size - 1
        end   = min(end, file_size - 1)
        chunk_size = end - start + 1

        def iter_file():
            with open(str(path), "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining > 0:
                    data = f.read(min(65536, remaining))
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            "Content-Range":  f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges":  "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type":   media_type,
        }
        return StreamingResponse(iter_file(), status_code=206, headers=headers, media_type=media_type)

    # No Range header — serve full file with Accept-Ranges header
    def iter_full():
        with open(str(path), "rb") as f:
            while True:
                data = f.read(65536)
                if not data:
                    break
                yield data

    headers = {
        "Accept-Ranges":  "bytes",
        "Content-Length": str(file_size),
        "Content-Type":   media_type,
    }
    return StreamingResponse(iter_full(), status_code=200, headers=headers, media_type=media_type)
