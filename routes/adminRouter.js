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
router.get('/users/specific/:deviceId', adminController.getSpecificUsersPerDevice)

// Device routes
router.get('/devices', adminController.getAllDevices);
router.post('/devices/', adminController.addDevice);
router.delete('/devices/:deviceId', adminController.deleteDevice);

module.exports = router;