const { StatusCodes } = require("http-status-codes");
const Device = require("../model/Device");
const Notification = require("../model/Notification"); // Import the Notification model
const { BadRequestError, NotFoundError } = require("../errors/ErrorClass");
const { format, startOfDay } = require("date-fns");

const updateRealTimeData = async (req, res) => {
  const { deviceNumber } = req.params;
  const sensorData = req.body;

  console.log(sensorData);
  if (!sensorData) {
    throw new BadRequestError("Sensor data is required");
  }

  try {
    const device = await Device.findOne({ deviceNumber });
    if (!device) {
      throw new NotFoundError(`Device with number ${deviceNumber} not found`);
    }

    // Ensure timestamp is valid
    if (
      !sensorData.timestamp ||
      sensorData.timestamp === "" ||
      new Date(sensorData.timestamp).toString() === "Invalid Date"
    ) {
      console.log("Invalid timestamp received, using server time");
      sensorData.timestamp = new Date().toISOString();
    }

    console.log(sensorData);
    // Update realTimeData with incoming sensor data
    device.realTimeData = sensorData;

    // Determine if we should also add to savedTimeFrameData
    const latestEntry =
      device.savedTimeFrameData.length > 0
        ? device.savedTimeFrameData[device.savedTimeFrameData.length - 1]
        : null;

    const currentTime = new Date(sensorData.timestamp || new Date());
    let shouldSaveTimeFrame = true;

    if (latestEntry) {
      const latestTime = new Date(latestEntry.timestamp);
      const timeDiffHours = (currentTime - latestTime) / (1000 * 60 * 60);

      // Only save if more than 3 hours have passed since last entry
      shouldSaveTimeFrame = timeDiffHours >= 3;
    }


    
    // If criteria met, also save to savedTimeFrameData
    if (shouldSaveTimeFrame) {
      device.savedTimeFrameData.push(sensorData);
      console.log(`Added entry to savedTimeFrameData at ${currentTime}`);
    }

    await device.save();

    // --- Notification Logic ---
    const { batteryPercentage } = sensorData;
    const { compostContainerOne, compostContainerTwo } = sensorData;

    // --- Battery Notifications ---
    if (batteryPercentage < 10) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "danger",
        message: `Device ${deviceNumber}: Battery level critically low (${batteryPercentage}%). This may cause the device to stop functioning soon. Please recharge immediately.`,
      });
    } else if (batteryPercentage < 30) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "warning",
        message: `Device ${deviceNumber}: Battery level is low (${batteryPercentage}%). It's advisable to recharge soon to ensure continuous operation.`,
      });
    } else if (batteryPercentage > 80) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "good",
        message: `Device ${deviceNumber}: Battery level is good (${batteryPercentage}%).`,
      });
    }

    // --- Methane Notifications (Compost Container One) ---
    if (compostContainerOne?.methane >= 1000) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "danger",
        message: `Device ${deviceNumber}: High methane level detected in Compost Container One (${compostContainerOne.methane}%). This often indicates anaerobic conditions due to excessive moisture or compaction, potentially leading to foul odors. Turning the compost pile might be necessary.`,
      });
    } else if (compostContainerOne?.methane >= 500) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "warning",
        message: `Device ${deviceNumber}: Elevated methane level in Compost Container One (${compostContainerOne.methane}%). This could suggest an imbalance in the composting process. Ensure good airflow and consider adding more carbon-rich materials.`,
      });
    } else if (compostContainerOne?.methane >= 5 && compostContainerOne?.methane <= 100) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "good",
        message: `Device ${deviceNumber}: Methane level in Compost Container One is within a good range (${compostContainerOne.methane}%), indicating healthy aerobic decomposition.`,
      });
    }

    // --- Methane Notifications (Compost Container Two) ---
    if (compostContainerTwo?.methane >= 1000) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "danger",
        message: `Device ${deviceNumber}: High methane level detected in Compost Container Two (${compostContainerTwo.methane}%). This often indicates anaerobic conditions due to excessive moisture or compaction, potentially leading to foul odors. Turning the compost pile might be necessary.`,
      });
    } else if (compostContainerTwo?.methane >= 500) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "warning",
        message: `Device ${deviceNumber}: Elevated methane level in Compost Container Two (${compostContainerTwo.methane}%). This could suggest an imbalance in the composting process. Ensure good airflow and consider adding more carbon-rich materials.`,
      });
    } else if (compostContainerTwo?.methane >= 5 && compostContainerTwo?.methane <= 100) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "good",
        message: `Device ${deviceNumber}: Methane level in Compost Container Two is within a good range (${compostContainerTwo.methane}%), indicating healthy aerobic decomposition.`,
      });
    }

    // --- Moisture Notifications (Compost Container One) ---
    if (compostContainerOne?.moisture > 80) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "danger",
        message: `Device ${deviceNumber}: Excessive moisture detected in Compost Container One (${compostContainerOne.moisture}%). This can lead to anaerobic conditions, slow down decomposition, and cause unpleasant smells. Consider adding dry materials like shredded paper or cardboard.`,
      });
    } else if (compostContainerOne?.moisture < 30) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "danger",
        message: `Device ${deviceNumber}: Very low moisture level detected in Compost Container One (${compostContainerOne.moisture}%). Decomposition relies on moisture; the process might significantly slow down or halt. Add some water or moist materials like fruit and vegetable scraps.`,
      });
    } else if (compostContainerOne?.moisture > 65 || compostContainerOne?.moisture < 40) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "warning",
        message: `Device ${deviceNumber}: Moisture level in Compost Container One is approaching suboptimal levels (${compostContainerOne.moisture}%). The ideal moisture is like a wrung-out sponge. Monitor and adjust as needed by adding dry or wet materials.`,
      });
    } else if (compostContainerOne?.moisture >= 40 && compostContainerOne?.moisture <= 65) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "good",
        message: `Device ${deviceNumber}: Moisture level in Compost Container One is within the optimal range (${compostContainerOne.moisture}%), which is ideal for active decomposition.`,
      });
    }

    // --- Moisture Notifications (Compost Container Two) ---
    if (compostContainerTwo?.moisture > 80) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "danger",
        message: `Device ${deviceNumber}: Excessive moisture detected in Compost Container Two (${compostContainerTwo.moisture}%). This can lead to anaerobic conditions, slow down decomposition, and cause unpleasant smells. Consider adding dry materials like shredded paper or cardboard.`,
      });
    } else if (compostContainerTwo?.moisture < 30) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "danger",
        message: `Device ${deviceNumber}: Very low moisture level detected in Compost Container Two (${compostContainerTwo.moisture}%). Decomposition relies on moisture; the process might significantly slow down or halt. Add some water or moist materials like fruit and vegetable scraps.`,
      });
    } else if (compostContainerTwo?.moisture > 65 || compostContainerTwo?.moisture < 40) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "warning",
        message: `Device ${deviceNumber}: Moisture level in Compost Container Two is approaching suboptimal levels (${compostContainerTwo.moisture}%). The ideal moisture is like a wrung-out sponge. Monitor and adjust as needed by adding dry or wet materials.`,
      });
    } else if (compostContainerTwo?.moisture >= 40 && compostContainerTwo?.moisture <= 65) {
      await Notification.create({
        deviceId: deviceNumber,
        level: "good",
        message: `Device ${deviceNumber}: Moisture level in Compost Container Two is within the optimal range (${compostContainerTwo.moisture}%), which is ideal for active decomposition.`,
      });
    }
    // Include in the response whether data was saved to time frame
    res.status(StatusCodes.OK).json({
      message: "Data updated successfully",
      savedToTimeFrame: shouldSaveTimeFrame,
    });
  } catch (error) {
    console.error("Update data error:", error);
    throw error;
  }
};

const getRealTimeData = async (req, res) => {
  const { deviceNumber } = req.params;

  try {
    const device = await Device.findOne({ deviceNumber });
    if (!device) {
      throw new NotFoundError(`Device with number ${deviceNumber} not found`);
    }

    res.status(StatusCodes.OK).json({ realTimeData: device.realTimeData });
  } catch (error) {
    console.error("Get real-time data error:", error);
    throw error;
  }
};

const getSavedTimeFrameData = async (req, res) => {
  const { deviceNumber } = req.params;
  const { timeFrame, dataType, parameter } = req.query;
  
  console.log("GETTING SAVED", deviceNumber)
  console.log(timeFrame, dataType, parameter)
  if (!timeFrame || !["day", "week", "month"].includes(timeFrame)) {
    throw new BadRequestError("Time frame (day, week, month) is required");
  }

  if (!dataType || !["energy", "solar", "compost"].includes(dataType)) {
    throw new BadRequestError("Data type (energy, solar, compost) is required");
  }

  if (
    !parameter ||
    ![
      "voltage",
      "current",
      "wattage",
      "methane",
      "temperatureIn",
      "temperatureOut",
      "moisture",
    ].includes(parameter)
  ) {
    throw new BadRequestError("Parameter is required");
  }

  try {
    const device = await Device.findOne({ deviceNumber });
    if (!device) {
      throw new NotFoundError(`Device with number ${deviceNumber} not found`);
    }

    console.log("DEVICE FOUND", device)

    let filteredData = [];
    const now = new Date();
    let timeInterval;
    let timeRange;

    if (timeFrame === "day") {
      timeInterval = 30 * 60 * 1000;
      timeRange = 24 * 60 * 60 * 1000;
    } else if (timeFrame === "week") {
      timeInterval = 3 * 60 * 60 * 1000;
      timeRange = 7 * 24 * 60 * 60 * 1000;
    } else {
      timeInterval = 8 * 60 * 60 * 1000; // 8 hours interval for month
      timeRange = 30 * 24 * 60 * 60 * 1000;
    }

    const startTime = new Date(now.getTime() - timeRange);

    filteredData = device.savedTimeFrameData
      .filter((data) => new Date(data.timestamp) >= startTime)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort by timestamp

    const processedData = {};

    if (dataType === "energy") {
      processedData["tegOne"] = [];
      processedData["tegTwo"] = [];
      processedData["solar"] = []; // Initialize solar data array
    } else if (dataType ===  "solar") {
      processedData["solar"] = [];
    } else {
      processedData["compostContainerOne"] = [];
      processedData["compostContainerTwo"] = [];
    }

    let currentTime = startTime.getTime();
    let previousDay = null; // Keep track of the previous day

    while (currentTime <= now.getTime()) {
      const endTime = currentTime + timeInterval;
      const intervalData = filteredData.filter(
        (data) =>
          new Date(data.timestamp).getTime() >= currentTime &&
          new Date(data.timestamp).getTime() < endTime
      );

      const lastDataPoint =
        intervalData.length > 0 ? intervalData[intervalData.length - 1] : null;

      if (lastDataPoint) {
        const timestamp = new Date(lastDataPoint.timestamp);
        const currentDay = startOfDay(timestamp);
        const isFirstLabelOfDay =
          !previousDay || currentDay.getTime() !== previousDay.getTime();

        const formatLabel = (date) => {
          if (timeFrame === "day") {
            return format(date, "HH:mm"); // 24-hour format starting from 0
          } else if (timeFrame === "week" || timeFrame === "month") {
            if (isFirstLabelOfDay) {
              return format(date, "MM/dd: HH:00");
            } else {
              return format(date, "HH:00");
            }
          }
          return "";
        };

        if (dataType === "energy") {
          // Process solar data
          if (
            lastDataPoint.solar &&
            lastDataPoint.solar[parameter] !== null &&
            lastDataPoint.solar[parameter] !== undefined
          ) {
            processedData["solar"].push({
              timestamp: lastDataPoint.timestamp,
              value: lastDataPoint.solar[parameter],
              label: formatLabel(timestamp),
              batteryPercentage: lastDataPoint.batteryPercentage,
              batteryVoltage: lastDataPoint.batteryVoltage,
            });
          }
          // Process tegOne data
          if (
            lastDataPoint.compostContainerOne?.tegOne &&
            lastDataPoint.compostContainerOne.tegOne[parameter] !== null &&
            lastDataPoint.compostContainerOne.tegOne[parameter] !== undefined
          ) {
            processedData["tegOne"].push({
              timestamp: lastDataPoint.timestamp,
              value: lastDataPoint.compostContainerOne.tegOne[parameter],
              label: formatLabel(timestamp),
              batteryPercentage: lastDataPoint.batteryPercentage,
              batteryVoltage: lastDataPoint.batteryVoltage,
            });
          }
          // Process tegTwo data
          if (
            lastDataPoint.compostContainerTwo?.tegTwo &&
            lastDataPoint.compostContainerTwo.tegTwo[parameter] !== null &&
            lastDataPoint.compostContainerTwo.tegTwo[parameter] !== undefined
          ) {
            processedData["tegTwo"].push({
              timestamp: lastDataPoint.timestamp,
              value: lastDataPoint.compostContainerTwo.tegTwo[parameter],
              label: formatLabel(timestamp),
              batteryPercentage: lastDataPoint.batteryPercentage,
              batteryVoltage: lastDataPoint.batteryVoltage,
            });
          }
        } else if (dataType === "solar") {
          if (
            lastDataPoint.solar &&
            lastDataPoint.solar[parameter] !== null &&
            lastDataPoint.solar[parameter] !== undefined
          ) {
            processedData["solar"].push({
              timestamp: lastDataPoint.timestamp,
              value: lastDataPoint.solar[parameter],
              label: formatLabel(timestamp),
              batteryPercentage: lastDataPoint.batteryPercentage,
              batteryVoltage: lastDataPoint.batteryVoltage,
            });
          }
        } else {
          if (
            lastDataPoint.compostContainerOne &&
            lastDataPoint.compostContainerOne[parameter] !== null &&
            lastDataPoint.compostContainerOne[parameter] !== undefined
          ) {
            processedData["compostContainerOne"].push({
              timestamp: lastDataPoint.timestamp,
              value: lastDataPoint.compostContainerOne[parameter],
              label: formatLabel(timestamp),
              batteryPercentage: lastDataPoint.batteryPercentage,
              batteryVoltage: lastDataPoint.batteryVoltage,
            });
          }
          if (
            lastDataPoint.compostContainerTwo &&
            lastDataPoint.compostContainerTwo[parameter] !== null &&
            lastDataPoint.compostContainerTwo[parameter] !== undefined
          ) {
            processedData["compostContainerTwo"].push({
              timestamp: lastDataPoint.timestamp,
              value: lastDataPoint.compostContainerTwo[parameter],
              label: formatLabel(timestamp),
              batteryPercentage: lastDataPoint.batteryPercentage,
              batteryVoltage: lastDataPoint.batteryVoltage,
            });
          }
        }

        previousDay = currentDay; // Update the previous day
      }

      currentTime += timeInterval;
    }

    res.status(StatusCodes.OK).json({ data: processedData });
  } catch (error) {
    console.error("Get processed time frame data error:", error);
    throw error;
  }
};

// This function is no longer directly called by ESP32
// but kept for backward compatibility or manual API calls
const updateSavedTimeFrameData = async (req, res) => {
  const { deviceNumber } = req.params;
  const { savedTimeFrameData } = req.body;

  if (!savedTimeFrameData) {
    throw new BadRequestError("Time frame data is required");
  }

  try {
    const device = await Device.findOne({ deviceNumber });
    if (!device) {
      throw new NotFoundError(`Device with number ${deviceNumber} not found`);
    }

    // Add new savedTimeFrameData
    device.savedTimeFrameData.push(savedTimeFrameData);

    await device.save();

    res
      .status(StatusCodes.CREATED)
      .json({ message: "Time frame data saved successfully" });
  } catch (error) {
    console.error("Save time frame data error:", error);
    throw error;
  }
};

module.exports = {
  updateRealTimeData,
  getRealTimeData,
  getSavedTimeFrameData,
  updateSavedTimeFrameData,
};