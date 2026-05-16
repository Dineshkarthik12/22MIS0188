const priorityInboxService = require('../services/priorityInboxService');
const { sendSuccess } = require('../utils/response');
const { safeLog } = require('../utils/logger');

const getPriorityInbox = async (req, res, next) => {
  try {
    const inbox = await priorityInboxService.getPriorityInbox();
    return sendSuccess(res, 200, 'Priority inbox generated successfully', inbox);
  } catch (error) {
    await safeLog('error', 'controller', `Priority inbox generation failed: ${error.message}`);
    return next(error);
  }
};

module.exports = {
  getPriorityInbox,
};
