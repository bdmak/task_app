const Joi = require("joi");

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

const create = Joi.object({
  title: Joi.string(),
  status: Joi.string()
    .valid("pending", "in-progress", "done")
    .default("pending")
    .messages({
      "any.only": "Status must be pending, in-progress, or done",
    }),
  dueDate: Joi.date(),
  userId: Joi.string().custom(objectIdValidator, "ObjectId validation").required().messages({
    "any.invalid": "userId must be a valid MongoDB ObjectId",
    "any.required": "userId is required",
  }),
});

module.exports = {
  create
};
