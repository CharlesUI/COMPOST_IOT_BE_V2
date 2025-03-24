const Notification = require("../model/Notification")
const User = require("../model/User"); // Assuming you need the User model to get their devices

const createNotification = async (req, res) => {
  try {
    const newNotification = new Notification(req.body);
    const savedNotification = await newNotification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification", error });
  }
};

const getNotificationsForDevice = async (req, res) => {

    console.log("Getting notif", req.params.deviceNumber)
    try {
      const { deviceNumber, userId } = req.params;
  
      if (!deviceNumber) {
        return res.status(400).json({ message: "Device number is required" });
      }
  
      const notifications = await Notification.find({ deviceId: deviceNumber }).sort({ timestamp: -1 });
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications for device:", error);
      res.status(500).json({ message: "Failed to fetch notifications for this device", error });
    }
  };


// Get unread notifications for a specific user (revised)
const getNotificationsForUser = async (req, res) => {
  console.log("Getting notif", req.params.deviceNumber)
  try {
    const { userId } = req.params;

    console.log("USER", userId)

    if (!userId) {
      return res.status(400).json({ message: "Device number is required" });
    }

    const notifications = await Notification.find({ userId: userId }).sort({ timestamp: -1 });
    console.log("NOTF", notifications)
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications for device:", error);
    res.status(500).json({ message: "Failed to fetch notifications for this device", error });
  }
};

// Mark a notification as read (remains the same)
const markNotificationAsRead = async (req, res) => {

};

// Optional: Delete a notification (remains the same)
const deleteNotification = async (req, res) => {
    try {
      const { notificationId } = req.params;
  
      if (!notificationId) {
        return res.status(400).json({ message: "Notification ID is required" });
      }
  
      const deletedNotification = await Notification.findByIdAndDelete(notificationId);
  
      if (!deletedNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
  
      res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification", error });
    }
  };

module.exports = {
    getNotificationsForDevice,
    getNotificationsForUser,
  createNotification,
  deleteNotification,
  markNotificationAsRead,
};
