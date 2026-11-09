const { useEffect, useRef, useState } = React;

function makeSyntheticFrame(w, h) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const base = Math.floor((x / w) * 180 + (y / h) * 50);
      const noise = Math.floor((Math.random() - 0.5) * 40);
      const r = Math.max(0, Math.min(255, base + 30 + noise));
      const g = Math.max(0, Math.min(255, base + noise));
      const b = Math.max(0, Math.min(255, base - 20 + noise));
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, w, h);
}

function rgbaToRgbArray(imgData) {
  const out = [];
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    out.push(d[i], d[i + 1], d[i + 2]);
  }
  return out;
}

function rgbArrayToImageData(rgb, w, h) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    rgba[j] = rgb[i];
    rgba[j + 1] = rgb[i + 1];
    rgba[j + 2] = rgb[i + 2];
    rgba[j + 3] = 255;
  }
  return new ImageData(rgba, w, h);
}

function App() {
  const w = 192, h = 128;
  const inCanvas = useRef(null);
  const outCanvas = useRef(null);
  const [metrics, setMetrics] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ctx = inCanvas.current.getContext("2d");
    ctx.putImageData(makeSyntheticFrame(w, h), 0, 0);
  }, []);

  async function processFrame() {
    setBusy(true);
    const inCtx = inCanvas.current.getContext("2d");
    const src = inCtx.getImageData(0, 0, w, h);

    const resp = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ width: w, height: h, data: rgbaToRgbArray(src) })
    });

    const json = await resp.json();
    const out = rgbArrayToImageData(json.data, json.width, json.height);
    outCanvas.current.getContext("2d").putImageData(out, 0, 0);
    setMetrics(json.metrics);
    setBusy(false);
  }

  return React.createElement("div", null,
    React.createElement("div", { className: "row" },
      React.createElement("div", { className: "panel" },
        React.createElement("h3", null, "Input (Noisy Frame)"),
        React.createElement("canvas", { ref: inCanvas, width: w, height: h })
      ),
      React.createElement("div", { className: "panel" },
        React.createElement("h3", null, "Output (NumPy Processed)"),
        React.createElement("canvas", { ref: outCanvas, width: w, height: h })
      )
    ),
    React.createElement("div", { style: { marginTop: "12px" } },
      React.createElement("button", { onClick: processFrame, disabled: busy }, busy ? "Processing..." : "Process Frame")
    ),
    metrics && React.createElement("div", { className: "panel", style: { marginTop: "12px" } },
      React.createElement("div", null, `mean_before: ${metrics.mean_before.toFixed(4)}`),
      React.createElement("div", null, `mean_after: ${metrics.mean_after.toFixed(4)}`),
      React.createElement("div", null, `edge_strength: ${metrics.edge_strength.toFixed(4)}`)
    ),
    React.createElement("p", null, "Tip: Click process multiple times after refreshing to test different noisy frames.")
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));