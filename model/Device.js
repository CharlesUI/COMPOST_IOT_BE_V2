const mongoose = require("mongoose");

const TimeDataSchema = new mongoose.Schema(
  {
    batteryPercentage: Number,
    batteryVoltage: Number,
    solar: { voltage: Number, current: Number, wattage: Number },
    compostContainerOne: {
      methane: Number,
      temperatureIn: Number,
      temperatureOut: Number,
      moisture: Number,
      tegOne: { voltage: Number, current: Number, wattage: Number },
    },
    compostContainerTwo: {
      methane: Number,
      temperatureIn: Number,
      temperatureOut: Number,
      moisture: Number,
      tegTwo: { voltage: Number, current: Number, wattage: Number },
    },
    timestamp: { type: Date, default: Date.now, index: true }, // Added index
  },
  { _id: false }
);

const deviceSchema = new mongoose.Schema({
  deviceNumber: { type: String, required: true, unique: true, index: true }, // Added index
  realTimeData: TimeDataSchema,
  savedTimeFrameData: [TimeDataSchema],
});

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;