const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const { validateBody } = require('../middleware/validationMiddleware');
const {
  validateCreateVehicle,
  validateMaintenanceRecord,
} = require('../validators/vehicleValidator');

const router = express.Router();

router.post(
  '/',
  validateBody(validateCreateVehicle),
  vehicleController.createVehicle
);

router.get('/upcoming-service', vehicleController.getUpcomingServiceVehicles);

router.get('/', vehicleController.getAllVehicles);

router.get('/:id', vehicleController.getVehicleById);

router.delete('/:id', vehicleController.deleteVehicle);

router.post(
  '/:id/maintenance',
  validateBody(validateMaintenanceRecord),
  vehicleController.addMaintenanceRecord
);

router.get('/:id/maintenance', vehicleController.getMaintenanceHistory);

module.exports = router;
