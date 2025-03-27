const User = require("../model/User"); // Assuming the User model is in the models directory
const Device = require("../model/Device"); // Assuming the Device model is in the models directory
const Admin = require("../model/Admin");
const Notification = require("../model/Notification");

const adminController = {
  // --- Admin Log Reg
  adminRegister: async (req, res) => {
    try {
      const { username, email, password, title } = req.body;

      // Check if email already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin email is already registered",
        });
      }

      // Create new admin
      const newAdmin = new Admin({ username, email, password, title });
      await newAdmin.save();

      // Fetch all existing users
      const allUsers = await User.find({}, "_id"); // Only fetch the _id

      // Fetch all existing devices
      const allDevices = await Device.find({}, "_id"); // Only fetch the _id

      // Update the newly created admin to include all existing users and devices
      newAdmin.managedUsers = allUsers.map((user) => user._id);
      newAdmin.managedDevices = allDevices.map((device) => device._id);
      await newAdmin.save();

      // Generate JWT token
      const token = newAdmin.createToken();

      res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        token,
        admin: {
          id: newAdmin._id,
          username: newAdmin.username,
          email: newAdmin.email,
          title: newAdmin.title,
          managedUsers: newAdmin.managedUsers,
          managedDevices: newAdmin.managedDevices,
        },
      });
    } catch (error) {
      console.error("Error registering admin:", error);
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((el) => el.message);
        return res
          .status(400)
          .json({ success: false, message: "Validation error", errors });
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to register admin" });
    }
  },

  // Admin Login (No changes needed here for this specific request)
  adminLogin: async (req, res) => {
    try {
      const { username, password } = req.body;

      console.log({ username, password });
      // Check if username exists
      const admin = await Admin.findOne({ username });
      if (!admin) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid admin credentials" });
      }

      // Compare passwords
      const isPasswordMatch = await admin.isMatch(password);
      if (!isPasswordMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid admin credentials" });
      }

      // Fetch all existing users
      const allUsers = await User.find({}, "_id"); // Only fetch the _id

      // Fetch all existing devices
      const allDevices = await Device.find({}, "_id"); // Only fetch the _id

      // Include all existing users and devices whenever an admin logged in
      admin.managedUsers = allUsers.map((user) => user._id);
      admin.managedDevices = allDevices.map((device) => device._id);

      // Generate JWT token
      const token = admin.createToken();

      console.log(admin)

      res.status(200).json({
        success: true,
        message: "Admin logged in successfully",
        token,
        admin: {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          title: admin.title,
          managedUsers: admin.managedUsers,
          managedDevices: admin.managedDevices,
        },
      });
    } catch (error) {
      console.error("Error logging in admin:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to login admin" });
    }
  },

  // --- User Management ---

  getSpecificUsersPerDevice: async (req, res) => {
    try {
      const deviceId = req.params.deviceId;

      // Find all users whose 'devices' array contains the deviceId
      const users = await User.find({ devices: deviceId });

      if (!users || users.length === 0) {
        return res.status(200).json({ users }); // Return an empty array if no users are found for the device
      }

      // Extract the usernames of the users
      const currentUsers = users.map((user) => user.username);

      res.status(200).json({ users: currentUsers });
    } catch (error) {
      console.error("Error fetching users for device:", error);
      res.status(500).json({ message: "Failed to fetch users for device" });
    }
  },
  // Get all users (for admin management)
  getAllUsersForAdmin: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
      console.error("Error fetching all users for admin:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch users" });
    }
  },

  getTotalUserCount: async (req, res) => {
    try {
      const count = await User.countDocuments();
      res.status(200).json({ totalUsers: count });
    } catch (error) {
      console.error("Error fetching total user count:", error);
      res.status(500).json({ message: "Failed to fetch total user count" });
    }
  },

  // Get the number of new users within a specified time period (e.g., last 7 days)
  getNewUsersCount: async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7; // Default to 7 days if not provided
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const count = await User.countDocuments({
        createdAt: { $gte: startDate },
      });

      res.status(200).json({ newUsers: count, period: `${days} days` });
    } catch (error) {
      console.error("Error fetching new user count:", error);
      res.status(500).json({ message: "Failed to fetch new user count" });
    }
  },

  // Get a specific user by ID
  getUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("Error fetching user:", error);
      if (error.kind === "ObjectId") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID format" });
      }
      res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
  },

  // Update user information by ID
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, devices } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { username, email, devices },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.kind === "ObjectId") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID format" });
      }
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((el) => el.message);
        return res
          .status(400)
          .json({ success: false, message: "Validation error", errors });
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to update user" });
    }
  },

  // Delete a user by ID
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error.kind === "ObjectId") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID format" });
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to delete user" });
    }
  },

  // Send notification to a specific user
  sendNotificationToUser: async (req, res) => {
    try {
      console.log(req.body);
      console.log(req.params);
      const { id: userId } = req.params; // Renamed id to userId for clarity
      const { message } = req.body;
      const { level = "info" } = req.body; // Optional: Allow admin to set notification level

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const newNotification = new Notification({
        userId: userId,
        message: message,
        level: level, // Use the provided level or default to "info"
      });
      await newNotification.save();

      res.status(200).json({
        success: true,
        message: `Notification sent to ${user.username}`,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      if (error.kind === "ObjectId") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID format" });
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to send notification" });
    }
  },

  // --- Device Management ---

  // Get all devices
  getAllDevices: async (req, res) => {
    try {
      const devices = await Device.find();
      res.status(200).json(devices);
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  },

  addDevice: async (req, res) => {
    try {
      const { deviceNumber } = req.body;
      if (!deviceNumber) {
        return res.status(400).json({ message: "Device number is required" });
      }
      const existingDevice = await Device.findOne({ deviceNumber });
      if (existingDevice) {
        return res
          .status(409)
          .json({ message: "Device with this number already exists" });
      }
      const newDevice = new Device({ deviceNumber });
      await newDevice.save();
      res
        .status(201)
        .json({ message: "Device added successfully", device: newDevice });
    } catch (error) {
      console.error("Error adding device:", error);
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ message: "Device with this number already exists" });
      }
      res.status(500).json({ message: "Failed to add device" });
    }
  },

  deleteDevice: async (req, res) => {
    try {
      const { deviceId } = req.params;
      console.log(deviceId);
      const deletedDevice = await Device.findByIdAndDelete(deviceId);
      if (!deletedDevice) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.status(200).json({ message: "Device deleted successfully" });
    } catch (error) {
      console.error("Error deleting device:", error);
      if (error.kind === "ObjectId") {
        return res.status(400).json({ message: "Invalid device ID format" });
      }
      res.status(500).json({ message: "Failed to delete device" });
    }
  },

  getTotalDeviceCount: async (req, res) => {
    try {
      const count = await Device.countDocuments();
      res.status(200).json({ totalDevices: count });
    } catch (error) {
      console.error("Error fetching total device count:", error);
      res.status(500).json({ message: "Failed to fetch total device count" });
    }
  },

  // Get the number of active devices (reporting data within the last 24 hours)
  getActiveDeviceCount: async (req, res) => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

      const count = await Device.countDocuments({
        "realTimeData.timestamp": { $gte: twentyFourHoursAgo },
      });
      res.status(200).json({ activeDevices: count });
    } catch (error) {
      console.error("Error fetching active device count:", error);
      res.status(500).json({ message: "Failed to fetch active device count" });
    }
  },

  // Get the number of inactive devices (not reporting data within the last 24 hours)
  getInactiveDeviceCount: async (req, res) => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

      const count = await Device.countDocuments({
        $or: [
          { "realTimeData.timestamp": { $lt: twentyFourHoursAgo } },
          { realTimeData: { $exists: false } }, // Devices that have never reported data
        ],
      });
      res.status(200).json({ inactiveDevices: count });
    } catch (error) {
      console.error("Error fetching inactive device count:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch inactive device count" });
    }
  },
  // Get the average battery percentage across all devices
  getAverageBatteryPercentage: async (req, res) => {
    try {
      const devices = await Device.find({
        "realTimeData.batteryPercentage": { $exists: true },
      });
      if (devices.length > 0) {
        const totalBattery = devices.reduce(
          (sum, device) => sum + device.realTimeData.batteryPercentage,
          0
        );
        const averageBattery = totalBattery / devices.length;
        console.log(averageBattery);
        res.status(200).json({ averageBattery });
      } else {
        res.status(200).json({ averageBattery: 0 }); // Or handle the case with no devices reporting battery
      }
    } catch (error) {
      console.error("Error fetching average battery percentage:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch average battery percentage" });
    }
  },

  // Get the average solar voltage across all devices
  getAverageSolarVoltage: async (req, res) => {
    try {
      const devices = await Device.find({
        "realTimeData.solar.voltage": { $exists: true },
      });
      if (devices.length > 0) {
        const totalVoltage = devices.reduce(
          (sum, device) => sum + device.realTimeData.solar.voltage,
          0
        );
        const averageSolarVoltage = totalVoltage / devices.length;
        console.log(averageSolarVoltage);
        res.status(200).json({ averageSolarVoltage });
      } else {
        res.status(200).json({ averageSolarVoltage: 0 }); // Or handle the case with no devices reporting solar voltage
      }
    } catch (error) {
      console.error("Error fetching average solar voltage:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch average solar voltage" });
    }
  },

  getSpecificDevicePerformance: async (req, res) => {
    try {
      const { deviceId } = req.params;

      const device = await Device.findOne({ deviceNumber: deviceId });

      if (!device || !device.realTimeData) {
        return res.status(404).json({
          message: "Device not found or no real-time data available.",
        });
      }

      const performanceData = {
        batteryPercentage: device.realTimeData.batteryPercentage,
        batteryVoltage: device.realTimeData.batteryVoltage,
        solarVoltage: device.realTimeData.solar?.voltage,
        solarCurrent: device.realTimeData.solar?.current,
        solarWattage: device.realTimeData.solar?.wattage,
        tegOneVoltage: device.realTimeData.compostContainerOne?.tegOne?.voltage,
        tegTwoVoltage: device.realTimeData.compostContainerTwo?.tegTwo?.voltage,
        compostOneTemperatureIn:
          device.realTimeData.compostContainerOne?.temperatureIn,
        compostOneTemperatureOut:
          device.realTimeData.compostContainerOne?.temperatureOut,
        compostOneMethane: device.realTimeData.compostContainerOne?.methane,
        compostOneMoisture: device.realTimeData.compostContainerOne?.moisture,
        compostTwoTemperatureIn:
          device.realTimeData.compostContainerTwo?.temperatureIn,
        compostTwoTemperatureOut:
          device.realTimeData.compostContainerTwo?.temperatureOut,
        compostTwoMethane: device.realTimeData.compostContainerTwo?.methane,
        compostTwoMoisture: device.realTimeData.compostContainerTwo?.moisture,
      };

      res.status(200).json({ performanceData });
    } catch (error) {
      console.error("Error fetching specific device performance data:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch specific device performance data" });
    }
  },
  getAllDevicesPerformance: async (req, res) => {
    try {
      const devices = await Device.find({}, "deviceNumber realTimeData"); // Fetch only deviceNumber and realTimeData

      const devicesPerformance = devices.map((device) => ({
        deviceNumber: device.deviceNumber,
        batteryPercentage: device.realTimeData?.batteryPercentage,
        batteryVoltage: device.realTimeData?.batteryVoltage,
        solarVoltage: device.realTimeData?.solar?.voltage,
        solarCurrent: device.realTimeData?.solar?.current,
        solarWattage: device.realTimeData?.solar?.wattage,
        tegOneVoltage:
          device.realTimeData?.compostContainerOne?.tegOne?.voltage,
        tegTwoVoltage:
          device.realTimeData?.compostContainerTwo?.tegTwo?.voltage,
        compostOneTemperatureIn:
          device.realTimeData?.compostContainerOne?.temperatureIn,
        compostOneTemperatureOut:
          device.realTimeData?.compostContainerOne?.temperatureOut,
        compostOneMethane: device.realTimeData?.compostContainerOne?.methane,
        compostOneMoisture: device.realTimeData?.compostContainerOne?.moisture,
        compostTwoTemperatureIn:
          device.realTimeData?.compostContainerTwo?.temperatureIn,
        compostTwoTemperatureOut:
          device.realTimeData?.compostContainerTwo?.temperatureOut,
        compostTwoMethane: device.realTimeData?.compostContainerTwo?.methane,
        compostTwoMoisture: device.realTimeData?.compostContainerTwo?.moisture,
      }));

      res.status(200).json({ devicesPerformance });
    } catch (error) {
      console.error("Error fetching all devices performance data:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch all devices performance data" });
    }
  },
  getLatestAlerts: async (req, res) => {
    try {
      // Fetch all existing device IDs first
      const existingDeviceNumbers = await Device.distinct('deviceNumber');
  
      // Fetch the latest notifications only for existing devices
      const latestNotifications = await Notification.find({
        deviceId: { $in: existingDeviceNumbers },
      })
        .sort({ timestamp: -1 });
  
      const alerts = latestNotifications.map((notification) => {
        let severity;
        switch (notification.level) {
          case "warning":
            severity = "warning";
            break;
          case "danger":
            severity = "danger";
            break;
          case "good":
          case "info":
          default:
            severity = "info";
        }
        return {
          _id: notification._id,
          message: notification.message,
          severity: severity,
          timestamp: notification.timestamp,
          deviceId: notification.deviceId,
        };
      });
  
      res.status(200).json({ alerts: alerts });
    } catch (error) {
      console.error("Error fetching latest alerts for existing devices:", error);
      res.status(500).json({ message: "Failed to fetch latest alerts" });
    }
  },
  getAllDeviceNotifications: async (req, res) => {
    try {
      // Fetch all existing device IDs first
      const existingDeviceNumbers = await Device.distinct('deviceNumber');
  
      // Fetch notifications only for existing devices
      const deviceNotifications = await Notification.find({
        deviceId: { $in: existingDeviceNumbers },
      }).sort({ timestamp: -1 }); // Fetch notifications with deviceId in the existingDeviceIds array, sorted by timestamp
  
      res.status(200).json({ notifications: deviceNotifications });
    } catch (error) {
      console.error("Error fetching device notifications for existing devices:", error);
      res.status(500).json({ message: "Failed to fetch device notifications" });
    }
  },
  deleteNotification: async (req, res) => {
    const notificationId = req.params.id;
    try {
      const deletedNotification = await Notification.findByIdAndDelete(
        notificationId
      );
      if (!deletedNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  },
};

module.exports = adminController;
