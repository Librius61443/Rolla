require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Location = require("./models/Locations.js");

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((err) => {
    console.error("Mongo connect err", err);
    process.exit(1);
  });


app.post("/api/locations", async (req, res) => {
  try {
    const { latitude, longitude, meta } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res
        .status(400)
        .json({ error: "latitude and longitude required (numbers)" });
    }

    const loc = await Location.create({
      latitude,
      longitude,
      meta: meta || {},
    });

    return res.status(201).json(loc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
