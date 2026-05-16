const vehicleService = require('../services/vehicleService');
const maintenanceService = require('../services/maintenanceService');
const { sendSuccess, sendError } = require('../utils/response');
const { safeLog } = require('../utils/logger');
const config = require('../config');

const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    return sendSuccess(res, 201, 'Vehicle created successfully', vehicle);
  } catch (error) {
    await safeLog('error', 'controller', `Vehicle creation failed: ${error.message}`);
    return next(error);
  }
};

const getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    return sendSuccess(res, 200, 'Vehicles retrieved successfully', vehicles);
  } catch (error) {
    await safeLog('error', 'controller', `Get all vehicles failed: ${error.message}`);
    return next(error);
  }
};

const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    return sendSuccess(res, 200, 'Vehicle retrieved successfully', vehicle);
  } catch (error) {
    await safeLog(
      'warn',
      'controller',
      `Get vehicle by id failed for id ${req.params.id}: ${error.message}`
    );
    return next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.deleteVehicle(req.params.id);
    return sendSuccess(res, 200, 'Vehicle deleted successfully', vehicle);
  } catch (error) {
    await safeLog(
      'error',
      'controller',
      `Vehicle deletion failed for id ${req.params.id}: ${error.message}`
    );
    return next(error);
  }
};

const getUpcomingServiceVehicles = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || config.upcomingServiceDays;
    const vehicles = await vehicleService.getUpcomingServiceVehicles(days);
    return sendSuccess(res, 200, 'Upcoming service vehicles retrieved successfully', vehicles);
  } catch (error) {
    await safeLog('error', 'controller', `Upcoming service query failed: ${error.message}`);
    return next(error);
  }
};

const addMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await maintenanceService.addMaintenanceRecord(req.params.id, req.body);
    return sendSuccess(res, 201, 'Maintenance record added successfully', record);
  } catch (error) {
    await safeLog(
      'error',
      'controller',
      `Add maintenance record failed for vehicle ${req.params.id}: ${error.message}`
    );
    return next(error);
  }
};

const getMaintenanceHistory = async (req, res, next) => {
  try {
    const history = await maintenanceService.getMaintenanceHistory(req.params.id);
    return sendSuccess(res, 200, 'Maintenance history retrieved successfully', history);
  } catch (error) {
    await safeLog(
      'error',
      'controller',
      `Get maintenance history failed for vehicle ${req.params.id}: ${error.message}`
    );
    return next(error);
  }
};

module.exports = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  deleteVehicle,
  getUpcomingServiceVehicles,
  addMaintenanceRecord,
  getMaintenanceHistory,
};
