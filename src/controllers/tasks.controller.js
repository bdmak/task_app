const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { tasksService } = require("../services");

const createTasks = catchAsync(async (req, res) => {

  const tasks = await tasksService.createTasks(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "Create a task",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: tasks,
    })
  );
});

const getTasks = catchAsync(async (req, res) => {
  let tasks = await tasksService.getTasks(req.query.page,req.query.limit);

  if (!tasks) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tasks not found");
  }

  res.status(httpStatus.OK).json(
    response({
      message: "Get Tasks",
      status: "OK",
      statusCode: httpStatus.OK,
      data: tasks
    })
  );
});


module.exports = {
  createTasks,
  getTasks
};
