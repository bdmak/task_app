const express = require('express');
const validate = require('../../middlewares/validate');
const tasksValidation = require('../../validations/tasks.validation');
const tasksController = require('../../controllers/tasks.controller');

const router = express.Router();

router.post('/create', validate(tasksValidation.create), tasksController.createTasks);
router.get('/', tasksController.getTasks);

module.exports = router;