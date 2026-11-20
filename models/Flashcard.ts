import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SUBJECTS } from "@/lib/subjects";

const schema = new Schema(
  {
    subject: { type: String, enum: SUBJECTS, required: true },
    topicTitle: { type: String, trim: true, maxlength: 120 },
    question: { type: String, required: true, trim: true, maxlength: 1000 },
    answer: { type: String, required: true, trim: true, maxlength: 1000 },
    highYieldTip: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ["learning", "mastered"], default: "learning" },
    reviewCount: { type: Number, default: 0, min: 0 },
    lastReviewedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ subject: 1, status: 1 });

export type Flashcard = InferSchemaType<typeof schema>;
export default (models.Flashcard as Model<Flashcard>) || model("Flashcard", schema);
