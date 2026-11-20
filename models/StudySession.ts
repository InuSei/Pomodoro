import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SUBJECTS } from "@/lib/subjects";

const schema = new Schema({
  subject: { type: String, enum: SUBJECTS, required: true },
  durationMinutes: { type: Number, required: true, min: 1, max: 240 },
  presetName: { type: String, trim: true, maxlength: 60 },
  microGoals: {
    type: [
      {
        _id: false,
        text: { type: String, required: true, trim: true, maxlength: 200 },
        completed: { type: Boolean, default: false },
      },
    ],
    validate: { validator: (v: unknown[]) => v.length <= 3, message: "At most 3 micro-goals" },
  },
  completedAt: { type: Date, default: Date.now, index: true },
});

export type StudySession = InferSchemaType<typeof schema>;
export default (models.StudySession as Model<StudySession>) || model("StudySession", schema);
