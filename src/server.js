const express = require("express");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "web")));

app.post("/api/process", (req, res) => {
  const payload = req.body;
  const py = spawn("python", [path.join(__dirname, "python", "image_pipeline.py")]);

  let stdout = "";
  let stderr = "";

  py.stdout.on("data", (d) => (stdout += d.toString()));
  py.stderr.on("data", (d) => (stderr += d.toString()));

  py.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "Python failed", details: stderr.trim() });
    }
    try {
      return res.json(JSON.parse(stdout));
    } catch (e) {
      return res.status(500).json({ error: "Invalid Python response", details: stdout });
    }
  });

  py.stdin.write(JSON.stringify(payload));
  py.stdin.end();
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "web", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});