import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  taskText: {
    type: String,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

const weeklyGoalSchema = new mongoose.Schema({
  week: {
    type: Number,
    required: true,
  },
  focus: {
    type: String,
    required: true,
  },
  tasks: [taskSchema],
});

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    examName: {
      type: String,
      required: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    weeklyGoals: [weeklyGoalSchema],
    tips: {
      type: [String],
      default: [],
    },
    progress: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const StudyPlan = mongoose.model("StudyPlan", studyPlanSchema);
export default StudyPlan;
