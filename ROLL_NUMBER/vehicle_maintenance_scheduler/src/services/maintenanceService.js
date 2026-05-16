const store = require('../data/store');
const vehicleService = require('./vehicleService');
const { safeLog } = require('../utils/logger');

const addMaintenanceRecord = async (vehicleId, payload) => {
  await vehicleService.getVehicleById(vehicleId);

  const records = await store.getAllMaintenanceRecords();

  const record = {
    id: store.generateId(),
    vehicleId,
    serviceType: payload.serviceType,
    description: payload.description,
    cost: Number(payload.cost),
    serviceDate: payload.serviceDate,
    nextRecommendedDate: payload.nextRecommendedDate || null,
  };

  records.push(record);
  await store.saveMaintenanceRecords(records);

  const vehicles = await store.getAllVehicles();
  const vehicleIndex = vehicles.findIndex((v) => v.id === vehicleId);
  if (vehicleIndex !== -1) {
    vehicles[vehicleIndex].lastServiceDate = payload.serviceDate;
    if (payload.nextRecommendedDate) {
      vehicles[vehicleIndex].nextServiceDate = payload.nextRecommendedDate;
    }
    await store.saveVehicles(vehicles);
  }

  await safeLog(
    'info',
    'service',
    `Maintenance record "${payload.serviceType}" added for vehicle id ${vehicleId}`
  );

  return record;
};

const getMaintenanceHistory = async (vehicleId) => {
  await vehicleService.getVehicleById(vehicleId);

  const records = await store.getAllMaintenanceRecords();
  const history = records
    .filter((r) => r.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

  await safeLog(
    'info',
    'service',
    `Retrieved ${history.length} maintenance records for vehicle id ${vehicleId}`
  );

  return history;
};

module.exports = {
  addMaintenanceRecord,
  getMaintenanceHistory,
};
