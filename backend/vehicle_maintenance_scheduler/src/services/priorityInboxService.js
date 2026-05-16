const evaluationApiClient = require('../clients/evaluationApiClient');
const { buildPriorityInbox } = require('../algorithms/priorityInbox');
const { config } = require('../config');
const { safeLog } = require('../utils/logger');

const getPriorityInbox = async () => {
  const k = config.priorityInboxSize;

  await safeLog('info', 'service', 'Priority inbox generation started; fetching notifications from evaluation API');

  const notifications = await evaluationApiClient.fetchNotifications();

  await safeLog(
    'info',
    'service',
    `Notifications fetched successfully: ${notifications.length} records received for top-${k} heap processing`
  );

  const { inbox, stats } = buildPriorityInbox(notifications, k);

  await safeLog(
    'debug',
    'service',
    `Priority heap processed ${stats.processedCount} unread notifications with ${stats.evictedCount} evictions to maintain top ${k}`
  );

  await safeLog(
    'info',
    'service',
    `Priority inbox top-${k} generation completed with ${inbox.length} notifications in final output`
  );

  return inbox;
};

module.exports = {
  getPriorityInbox,
};
