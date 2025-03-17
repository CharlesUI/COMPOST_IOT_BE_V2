const { StatusCodes } = require("http-status-codes");
const Device = require("../model/Device");
const { BadRequestError, NotFoundError } = require("../errors/ErrorClass");
const { format, startOfDay } = require("date-fns");

const updateRealTimeData = async (req, res) => {
  const { deviceNumber } = req.params;
  const sensorData = req.body;

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

    // Update realTimeData with incoming sensor data
    device.realTimeData = sensorData;

    // Determine if we should also add to savedTimeFrameData
    // Find the most recent savedTimeFrameData entry
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

  if (!timeFrame || !["day", "week", "month"].includes(timeFrame)) {
    throw new BadRequestError("Time frame (day, week, month) is required");
  }

  if (!dataType || !["energy", "compost"].includes(dataType)) {
    throw new BadRequestError("Data type (energy, compost) is required");
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
      timeInterval = 6 * 60 * 60 * 1000; // 6 hours interval for month
      timeRange = 30 * 24 * 60 * 60 * 1000;
    }

    const startTime = new Date(now.getTime() - timeRange);

    filteredData = device.savedTimeFrameData
      .filter((data) => new Date(data.timestamp) >= startTime)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort by timestamp

    const processedData = {};
    let dataSet1Name, dataSet2Name;

    if (dataType === "energy") {
      dataSet1Name = "solar";
      dataSet2Name = "teg";
    } else {
      dataSet1Name = "compostContainerOne";
      dataSet2Name = "compostContainerTwo";
    }

    processedData[dataSet1Name] = [];
    processedData[dataSet2Name] = [];

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

        if (
          lastDataPoint[dataSet1Name] &&
          lastDataPoint[dataSet1Name][parameter] !== null &&
          lastDataPoint[dataSet1Name][parameter] !== undefined
        ) {
          processedData[dataSet1Name].push({
            timestamp: lastDataPoint.timestamp,
            value: lastDataPoint[dataSet1Name][parameter],
            label: formatLabel(timestamp),
            batteryPercentage: lastDataPoint.batteryPercentage,
            batteryVoltage: lastDataPoint.batteryVoltage,
          });
        }
        if (
          lastDataPoint[dataSet2Name] &&
          lastDataPoint[dataSet2Name][parameter] !== null &&
          lastDataPoint[dataSet2Name][parameter] !== undefined
        ) {
          processedData[dataSet2Name].push({
            timestamp: lastDataPoint.timestamp,
            value: lastDataPoint[dataSet2Name][parameter],
            label: formatLabel(timestamp),
            batteryPercentage: lastDataPoint.batteryPercentage,
            batteryVoltage: lastDataPoint.batteryVoltage,
          });
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
