// routes/vision.js
const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'rolla-accessibility-secret-key-2026';

const prompt = `
You are an accessibility auditor. Analyze the image and respond with ONLY valid JSON (no markdown, no extra text).

Task:
1) Decide if the image shows a disability-relevant accessibility obstacle or accessibility feature.
- Return is_relevant=true ONLY if you can clearly see ramps, stairs, elevators, doors/entrances, sidewalks/curbs, accessible parking, washrooms, signage, tactile paving, obstructions, or barriers impacting mobility/vision/hearing access.
- Return is_relevant=false if the image is random/irrelevant (food, selfies, pets, landscapes, etc.) OR if you cannot determine anything accessibility-related.

2) If is_relevant=true, rate the observed conditions from 0 to 5:
- ramp_condition (0 if no ramp visible)
- stairs_condition (0 if no stairs visible)
- elevator_condition (0 if no elevator visible)
- doorway_entrance_condition (0 if no doorway/entrance visible)
- sidewalk_curb_condition (0 if no sidewalk/curb visible)
- obstruction_hazard_level (0 if no obstruction visible; 5 = severe barrier)

3) Provide 1–3 short reasons grounded in visible evidence.
4) Provide "observed_elements" listing what you actually see.

Rules:
- If something is not visible, set its score to 0 and mention "not visible" in reasons if needed.
- Do NOT guess. Use conservative ratings.
- Keep reasons concrete (e.g., "no handrail visible", "steep incline", "blocked path").

Return JSON exactly in this shape:

{
  "is_relevant": boolean,
  "overall_assessment": "string (max 1 sentence)",
  "scores": {
    "ramp_condition": 0-5,
    "stairs_condition": 0-5,
    "elevator_condition": 0-5,
    "doorway_entrance_condition": 0-5,
    "sidewalk_curb_condition": 0-5,
    "obstruction_hazard_level": 0-5
  },
  "observed_elements": ["..."],
  "reasons": ["...", "...", "..."],
  "confidence": 0-100
}
`;

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Token invalid, continue without user
  }
  next();
};

router.post('/summarize', optionalAuth, upload.single('photo'), async (req, res) =>  {
      console.log("=== VISION ROUTE HIT ===");
    console.log("Has file:", !!req.file);
    console.log("Has auth header:", !!req.headers.authorization);
    console.log("OPENROUTER KEY EXISTS:", !!process.env.OPENROUTER_API_KEY);
    console.log("VISION HIT", { hasAuthHeader: !!req.headers.authorization });
  try {
    if (!req.file) return res.status(400).json({ error: "Missing photo" });

    const mime = req.file.mimetype || "image/jpeg";
    const b64 = req.file.buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${b64}`;


    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`.trim(),
        "Content-Type": "application/json",
        "Accept": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://example.com",
        "X-Title": process.env.OPENROUTER_APP_NAME || "gpt",
    },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview", // any vision-capable model on OpenRouter
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text", text: prompt,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

   console.log("OpenRouter status:", r.status);

    const raw = await r.text();
    console.log("RAW MODEL RESPONSE:", raw);

    let parsed;
    try {
    parsed = JSON.parse(raw);
    } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
        console.log("FAILED TO PARSE JSON");
        return res.json({ is_relevant: false, error: "Non-JSON response", raw });
    }
    parsed = JSON.parse(match[0]);
    }

    if (!parsed.is_relevant || parsed.confidence < 80) {
        console.log("VISION BLOCKED:", {
            is_relevant: parsed.is_relevant,
            confidence: parsed.confidence,
        });

        return res.status(200).json({
            is_relevant: false,
            blocked: true,
            reason: "Low confidence or not accessibility-related",
            confidence: parsed.confidence,
        });
    }

    return res.json(parsed);


    } catch (e) {
    console.error("VISION ERROR:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
});

module.exports = router;
