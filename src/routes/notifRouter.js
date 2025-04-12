// routes/notificationRoutes.js  <-- Rename this file for clarity
const express = require('express');
const router = express.Router();
const {
    createNotification,
    deleteNotification,
    markNotificationAsRead,
    getNotificationsForUser,
    getNotificationsForDevice,
    deleteNotificationsViaBody,
} = require('../controllers/notifController');

// Routes

// Get notifications from Devices
router.get("/:deviceNumber", getNotificationsForDevice);

// Get unread notifications for a specific user
router.get('/user/:userId', getNotificationsForUser);

// Create a new notification (might want to specify the device here)
router.post('/', createNotification); // Or /device/:deviceNumber

// Delete a specific notification using its ID
router.delete('/:notificationId', deleteNotification);

router.delete('/deleteAll/:deviceNumber/:userId', deleteNotificationsViaBody);

// Mark a specific notification as read using its ID
router.patch('/:notificationId/read', markNotificationAsRead);

module.exports = router;