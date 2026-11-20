import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const DEFAULT_NOTES = [
  "Take a deep breath, stretch your shoulders, and hydrate!",
  "One topic at a time—you're going to crush the MTLE!",
  "Rest is part of retention. Proud of how hard you're working!",
];

// Single document: read it through getConfig() in lib/config.ts, which creates it on first use.
const schema = new Schema({
  displayName: { type: String, default: "Future RMT", trim: true, maxlength: 60 },
  examDate: Date,
  themeMode: { type: String, enum: ["light", "dark"], default: "light" },
  customPresets: [
    {
      _id: false,
      id: { type: String, required: true },
      name: { type: String, required: true, trim: true, maxlength: 60 },
      segments: [
        {
          _id: false,
          type: { type: String, enum: ["focus", "break"], required: true },
          minutes: { type: Number, required: true, min: 1, max: 240 },
        },
      ],
    },
  ],
  encouragementNotes: {
    type: [{ type: String, trim: true, maxlength: 300 }],
    default: () => [...DEFAULT_NOTES],
  },
});

export type UserConfig = InferSchemaType<typeof schema>;
export default (models.UserConfig as Model<UserConfig>) || model("UserConfig", schema);
