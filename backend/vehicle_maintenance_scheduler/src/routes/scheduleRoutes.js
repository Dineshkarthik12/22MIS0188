const express = require('express');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

router.get('/', scheduleController.getAllSchedules);
router.get('/:depotId', scheduleController.getScheduleByDepotId);

module.exports = router;
