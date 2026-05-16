const store = require('../data/store');
const { addDays } = require('../utils/dateUtils');
const { safeLog } = require('../utils/logger');

const DEFAULT_SERVICE_INTERVAL_DAYS = 180;

const createVehicle = async (payload) => {
  const vehicles = await store.getAllVehicles();

  const duplicate = vehicles.find(
    (v) => v.vehicleNumber.toLowerCase() === payload.vehicleNumber.toLowerCase()
  );
  if (duplicate) {
    const error = new Error(
      `Vehicle creation failed: vehicleNumber "${payload.vehicleNumber}" already exists`
    );
    error.statusCode = 409;
    throw error;
  }

  const nextServiceDate =
    payload.nextServiceDate || addDays(payload.lastServiceDate, DEFAULT_SERVICE_INTERVAL_DAYS);

  const vehicle = {
    id: store.generateId(),
    ownerName: payload.ownerName,
    vehicleNumber: payload.vehicleNumber,
    brand: payload.brand,
    model: payload.model,
    lastServiceDate: payload.lastServiceDate,
    nextServiceDate,
    mileage: Number(payload.mileage),
    createdAt: new Date().toISOString(),
  };

  vehicles.push(vehicle);
  await store.saveVehicles(vehicles);

  await safeLog(
    'info',
    'service',
    `Vehicle created successfully for owner "${vehicle.ownerName}" with number ${vehicle.vehicleNumber}`
  );

  return vehicle;
};

const getAllVehicles = async () => {
  const vehicles = await store.getAllVehicles();
  await safeLog('info', 'service', `Retrieved ${vehicles.length} vehicles from storage`);
  return vehicles;
};

const getVehicleById = async (id) => {
  const vehicles = await store.getAllVehicles();
  const vehicle = vehicles.find((v) => v.id === id);

  if (!vehicle) {
    const error = new Error(`Vehicle not found with id: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  return vehicle;
};

const deleteVehicle = async (id) => {
  const vehicles = await store.getAllVehicles();
  const index = vehicles.findIndex((v) => v.id === id);

  if (index === -1) {
    const error = new Error(`Vehicle deletion failed: no vehicle found with id ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const [removed] = vehicles.splice(index, 1);
  await store.saveVehicles(vehicles);

  const maintenanceRecords = await store.getAllMaintenanceRecords();
  const filtered = maintenanceRecords.filter((m) => m.vehicleId !== id);
  await store.saveMaintenanceRecords(filtered);

  await safeLog(
    'info',
    'service',
    `Vehicle ${removed.vehicleNumber} (id: ${id}) and associated maintenance records deleted`
  );

  return removed;
};

const getUpcomingServiceVehicles = async (withinDays) => {
  const vehicles = await store.getAllVehicles();
  const today = new Date();

  const upcoming = vehicles.filter((vehicle) => {
    const nextDate = new Date(vehicle.nextServiceDate);
    const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= withinDays;
  });

  await safeLog(
    'info',
    'service',
    `Found ${upcoming.length} vehicles with service due within ${withinDays} days`
  );

  return upcoming;
};

module.exports = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  deleteVehicle,
  getUpcomingServiceVehicles,
};
