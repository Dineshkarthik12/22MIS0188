const express = require('express');
const scheduleRoutes = require('./scheduleRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Vehicle Maintenance Scheduler microservice is running',
    data: { status: 'healthy' },
  });
});

router.use('/schedule', scheduleRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
