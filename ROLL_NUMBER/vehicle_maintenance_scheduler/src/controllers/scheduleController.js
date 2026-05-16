const schedulerService = require('../services/schedulerService');
const { sendSuccess } = require('../utils/response');
const { safeLog } = require('../utils/logger');

const getAllSchedules = async (req, res, next) => {
  try {
    const schedules = await schedulerService.generateAllSchedules();
    return sendSuccess(res, 200, 'Schedules generated successfully', schedules);
  } catch (error) {
    await safeLog(
      'error',
      'controller',
      `Schedule generation failed for all depots: ${error.message}`
    );
    return next(error);
  }
};

const getScheduleByDepotId = async (req, res, next) => {
  try {
    const schedule = await schedulerService.generateScheduleForDepot(req.params.depotId);
    return sendSuccess(res, 200, 'Depot schedule generated successfully', schedule);
  } catch (error) {
    await safeLog(
      'error',
      'controller',
      `Schedule generation failed for depot ${req.params.depotId}: ${error.message}`
    );
    return next(error);
  }
};

module.exports = {
  getAllSchedules,
  getScheduleByDepotId,
};
