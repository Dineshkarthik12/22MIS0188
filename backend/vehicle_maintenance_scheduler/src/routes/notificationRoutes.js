const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/priority-inbox', notificationController.getPriorityInbox);

module.exports = router;
