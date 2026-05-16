const express = require('express');
const vehicleRoutes = require('./vehicleRoutes');

const router = express.Router();

router.use('/vehicles', vehicleRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Vehicle Maintenance Scheduler API is running',
    data: { status: 'healthy' },
  });
});

module.exports = router;
