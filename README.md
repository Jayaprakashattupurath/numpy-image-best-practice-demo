# NumPy Best Practice Demo: Image Representation and Manipulation

A small, practical codebase showing a **real-time style use case**:

- A noisy camera-like frame arrives in the UI.
- Python + NumPy processes it (denoise + contrast stretch + edge enhancement).
- Node handles API routing.
- React displays before/after results.

## Why this scenario matters

In production systems (quality inspection, CCTV pre-processing, robotics), incoming frames are often noisy or low contrast. You need lightweight processing before human review or model inference.

This demo shows a minimal but realistic path.

---

## Tech Stack

- **Python + NumPy**: image math pipeline
- **Node + Express**: API bridge to Python
- **React (CDN)**: lightweight frontend view

---

## NumPy Best Practices used

1. **Use explicit dtypes**
   - Convert `uint8 -> float32` for math stability.
2. **Normalize to [0, 1]**
   - Easier and safer for chained operations.
3. **Vectorize operations**
   - No per-pixel Python loops in core pipeline.
4. **Clip after transforms**
   - Keep values in valid range.
5. **Convert back to uint8 only at output**
   - Efficient and compatible with displays/transports.
6. **Keep I/O boundaries clear**
   - JSON in/out, predictable shape checks.

---

## Project Structure

- `src/python/image_pipeline.py` — NumPy processing logic
- `src/server.js` — Express server + Python child process call
- `src/web/index.html` — app shell
- `src/web/app.js` — React UI and canvas rendering

---

## Run Locally

## 1) Install dependencies

```bash
npm install
pip install -r requirements.txt
```

## 2) Start server

```bash
npm start
```

Open: `http://localhost:3000`

---

## How it works (data flow)

1. React creates a synthetic noisy frame (canvas).
2. Frontend sends `{ width, height, data:[r,g,b,...] }` to `/api/process`.
3. Node spawns Python script and passes payload via stdin.
4. NumPy pipeline processes image and returns processed RGB + metrics.
5. React renders result in output canvas.

---

## Guidance for real-world adaptation

- Replace synthetic frame with:
  - webcam capture, RTSP frame snapshot, or uploaded image.
- Keep processing modular:
  - split denoise, normalization, enhancement into separate functions.
- Add timing logs:
  - monitor ms/frame for throughput.
- For larger workloads:
  - use worker queues, multiprocessing, or move to OpenCV/Numba where needed.
- Add validation:
  - enforce max dimensions and input size to prevent abuse.

---

## Notes

This is intentionally lightweight (no heavy framework/tooling) but keeps architecture close to real usage so you can extend it quickly.