require("dotenv").config();

console.log("ENV MONGODB_URI =", process.env.MONGODB_URI);

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   MongoDB Connection
======================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    // No process.exit — let pod stay alive
  });

/* =======================
   Middleware
======================= */
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =======================
   Uploads Directory
======================= */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

/* =======================
   Routes — /api prefix to match frontend
======================= */
app.use("/api/pdfs", require("./routes/pdf"));
app.use("/api/ai", require("./routes/ai"));

/* =======================
   Health Check
======================= */
app.get("/", (req, res) => {
  res.json({
    status: "✅ Backend running",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

/* =======================
   404 Handler
======================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* =======================
   Error Handler
======================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

/* =======================
   Start Server
======================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});