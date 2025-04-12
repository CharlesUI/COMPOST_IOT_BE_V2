const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminControllers');

// Admin log reg
router.route("/register").post(adminController.adminRegister);
router.route("/login").post(adminController.adminLogin);

// Administrative Functions
router.route("/users").get(adminController.getAllUsersForAdmin); // OKAY
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/notify', adminController.sendNotificationToUser);
router.post('/device/:id/notify', adminController.sendNotificationToDevice);
router.get('/users/specific/:deviceId', adminController.getSpecificUsersPerDevice)

// Route to get the total number of users
router.get('/dashboard/users/count', adminController.getTotalUserCount);
// Route to get the number of new users in a specified period (e.g., /api/admin/dashboard/users/new?days=7)
router.get('/dashboard/users/new', adminController.getNewUsersCount);
// Route to get the total number of devices
router.get('/dashboard/devices/count/total', adminController.getTotalDeviceCount);
// Route to get the number of active devices
router.get('/dashboard/devices/count/active', adminController.getActiveDeviceCount);
// Route to get the number of inactive devices
router.get('/dashboard/devices/count/inactive', adminController.getInactiveDeviceCount);
// Route to get the average battery percentage
router.get('/dashboard/performance/average-battery', adminController.getAverageBatteryPercentage);
// Route to get the average solar voltage
router.get('/dashboard/performance/average-solar-voltage', adminController.getAverageSolarVoltage);
// Route to get real-time performance data for a specific device
router.get('/dashboard/performance/device/:deviceId', adminController.getSpecificDevicePerformance);
// Route to get real-time performance data for all devices
router.get('/dashboard/performance/devices/all', adminController.getAllDevicesPerformance);
// Route to get the latest alerts
router.get('/dashboard/alerts/latest', adminController.getLatestAlerts);
// Route for All Notifications
router.get('/notifications/all', adminController.getAllDeviceNotifications);

router.delete('/notifications/:id', adminController.deleteNotification);

router.delete('/clearAllNotifications', adminController.clearAllNotifications)





// Device routes
router.get('/devices', adminController.getAllDevices);
router.post('/devices/', adminController.addDevice);
router.delete('/devices/:deviceId', adminController.deleteDevice);

module.exports = router;