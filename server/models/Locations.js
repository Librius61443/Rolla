const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true } // creates createdAt/updatedAt automatically
);

module.exports = mongoose.model("Location", LocationSchema);
