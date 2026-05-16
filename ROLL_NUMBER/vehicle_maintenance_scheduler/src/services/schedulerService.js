const evaluationApiClient = require('../clients/evaluationApiClient');
const { solveKnapsack } = require('../algorithms/knapsack');
const { safeLog } = require('../utils/logger');
const { AppError } = require('../utils/errors');

const buildDepotSchedule = (depot, tasks) => {
  const depotId = depot.ID ?? depot.id ?? depot.depotId;
  const mechanicHours = depot.MechanicHours ?? depot.mechanicHours;

  if (depotId === undefined || mechanicHours === undefined) {
    throw new AppError('Depot record missing required ID or MechanicHours field', 502);
  }

  const { selectedTasks, totalDuration, totalImpact } = solveKnapsack(
    Number(mechanicHours),
    tasks
  );

  return {
    depotId: Number(depotId),
    mechanicHours: Number(mechanicHours),
    selectedTasks,
    totalDuration,
    totalImpact,
  };
};

const generateAllSchedules = async () => {
  await safeLog('info', 'service', 'Scheduler execution started for all depots');

  const [depots, vehicles] = await Promise.all([
    evaluationApiClient.fetchDepots(),
    evaluationApiClient.fetchVehicles(),
  ]);

  if (depots.length === 0) {
    throw new AppError('Depot API returned empty depot list; cannot generate schedules', 502);
  }

  if (vehicles.length === 0) {
    await safeLog('warn', 'service', 'Vehicles API returned zero tasks; schedules will have no selected tasks');
  }

  await safeLog(
    'info',
    'service',
    `Knapsack computation started for ${depots.length} depots against ${vehicles.length} maintenance tasks`
  );

  const schedules = [];

  for (const depot of depots) {
    const depotId = depot.ID ?? depot.id;
    await safeLog(
      'debug',
      'service',
      `Running 0/1 knapsack optimization for depot ${depotId} with capacity ${depot.MechanicHours} hours`
    );

    const schedule = buildDepotSchedule(depot, vehicles);
    schedules.push(schedule);

    await safeLog(
      'info',
      'service',
      `Depot ${schedule.depotId} optimization completed: ${schedule.selectedTasks.length} tasks selected, total impact ${schedule.totalImpact}, duration ${schedule.totalDuration}/${schedule.mechanicHours}`
    );
  }

  await safeLog(
    'info',
    'service',
    `Scheduler execution completed successfully for ${schedules.length} depots`
  );

  return schedules;
};

const generateScheduleForDepot = async (depotIdParam) => {
  const depotId = Number(depotIdParam);
  if (Number.isNaN(depotId)) {
    throw new AppError(`Invalid depotId parameter "${depotIdParam}"; expected numeric depot ID`, 400);
  }

  await safeLog('info', 'service', `Scheduler execution started for depot ${depotId}`);

  const [depots, vehicles] = await Promise.all([
    evaluationApiClient.fetchDepots(),
    evaluationApiClient.fetchVehicles(),
  ]);

  const depot = depots.find((d) => Number(d.ID ?? d.id) === depotId);

  if (!depot) {
    throw new AppError(`Depot not found with id ${depotId} in evaluation service response`, 404);
  }

  await safeLog(
    'info',
    'service',
    `Knapsack computation started for depot ${depotId} with ${vehicles.length} candidate tasks`
  );

  const schedule = buildDepotSchedule(depot, vehicles);

  await safeLog(
    'info',
    'service',
    `Depot ${depotId} optimization completed with total impact ${schedule.totalImpact} and duration ${schedule.totalDuration}`
  );

  return schedule;
};

module.exports = {
  generateAllSchedules,
  generateScheduleForDepot,
};
