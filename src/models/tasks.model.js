const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "in-progress", "done"],
        message: "Status must be pending, in-progress, or done",
      },
      default: "pending",
    },
    dueDate: {
      type: Date,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
  },
  { timestamps: true }
);


taskSchema.pre("save", async function (next) {
  const tasks = this;
  next();
});

const tasks = mongoose.model("tasks", taskSchema);

module.exports = tasks;
