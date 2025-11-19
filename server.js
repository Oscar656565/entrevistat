// server.js (ESM)
// Requiere "type": "module" en package.json

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ---- Paths (__dirname en ESM) ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- App base ----
const app = express();
const PORT = process.env.PORT || 3000;

// ---- Config de API y modelo ----
// Usa EXACTAMENTE un nombre que salga en /api/models, SIN el prefijo "models/"
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.GA_MODEL || "gemini-2.5-flash";

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  Falta GEMINI_API_KEY en .env");
}

// ---- Middlewares ----
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,             // 30 req/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 429, message: "Rate limit: intenta de nuevo en unos segundos." } },
});
app.use("/api/", apiLimiter);

// ---- Proxy principal a Gemini ----
app.post("/api/gemini", async (req, res) => {
  try {
    const url = `${API_BASE}/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    console.log("Gemini status:", upstream.status);
    console.log("Gemini response:", JSON.stringify(data, null, 2));
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: { code: 500, message: "Proxy error to Gemini", detail: String(err) } });
  }
});

// ---- Diagnóstico: listar modelos disponibles ----
app.get("/api/models", async (_req, res) => {
  try {
    const url = `${API_BASE}/models?key=${process.env.GEMINI_API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: { code: 500, message: "No se pudo listar modelos", detail: String(e) } });
  }
});

// ---- Healthcheck ----
app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString(), model: MODEL, base: API_BASE });
});

// ---- Fallback SPA (opcional) ----
app.get("*", (req, res, next) => {
  if (req.path.includes(".")) return next(); // deja servir archivos reales
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---- Arranque ----
app.listen(PORT, () => {
  console.log(`✅ Servidor listo: http://localhost:${PORT}`);
});
