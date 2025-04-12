const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Added userId
    deviceId: { type: String },
    level: {
      type: String,
      enum: ["info", "good", "warning", "danger"],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    data: mongoose.Schema.Types.Mixed, // Optional: Store specific data related to the notification
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;