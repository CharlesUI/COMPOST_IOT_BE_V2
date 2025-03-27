// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getRealTimeData, 
  updateRealTimeData, // Renamed from postRealTimeData
  getSavedTimeFrameData, 
  updateSavedTimeFrameData, // Renamed from postSavedTimeFrameData
} = require('../controllers/deviceController');

// Routes
router.get('/:deviceNumber/real-time', getRealTimeData);
router.post('/:deviceNumber/real-time', updateRealTimeData);

router.get('/:deviceNumber/saved-time-frame', getSavedTimeFrameData);
router.post('/:deviceNumber/saved-time-frame', updateSavedTimeFrameData);

module.exports = router;