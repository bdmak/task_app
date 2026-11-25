const httpStatus = require("http-status");
const { Tasks } = require("../models");
const ApiError = require("../utils/ApiError");

const createTasks = async (userBody) => {
  return Tasks.create({ ...userBody});
};


const getTasks = async ({page = 1, limit = 10 } = {}) => {
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const perPage = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (currentPage - 1) * perPage;

  const [total, data] = await Promise.all([
    Tasks.find().sort({ createdAt: -1 }).skip(skip).limit(perPage),
  ]);

  return {
    total,
    page: currentPage,
    limit: perPage,
    data,
  };
};


module.exports = {
  createTasks,
  getTasks
};