// The 6 MTLE board subjects (spec.md §3.3). Stored by full name.
export const SUBJECTS = [
  "Clinical Chemistry",
  "Microbiology & Parasitology",
  "Hematology",
  "Blood Banking / Immunohematology & Serology",
  "Clinical Microscopy",
  "Histopathologic Techniques & Medical Technology Laws",
] as const;

export type Subject = (typeof SUBJECTS)[number];

// Pill / tab-title labels.
export const SUBJECT_SHORT: Record<Subject, string> = {
  "Clinical Chemistry": "CC",
  "Microbiology & Parasitology": "Micro/Para",
  Hematology: "Hema",
  "Blood Banking / Immunohematology & Serology": "ISBB",
  "Clinical Microscopy": "CM",
  "Histopathologic Techniques & Medical Technology Laws": "Histopath",
};
