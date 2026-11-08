export type ApplicationStatus =
  | "new"
  | "under_review"
  | "contacted"
  | "approved"
  | "rejected"
  | "archived";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "remote"
  | "internship"
  | "other";

export type JobApplication = {
  opportunityType?: import("../utils/talent-application").OpportunityType | null;
  workMode?: import("../utils/talent-application").WorkMode | null;
  careerArea?: import("../utils/talent-application").CareerArea | null;
  applicationKind?: "talent_pool" | null;
  portfolioUrl?: string | null;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string | null;
  city: string | null;
  specialization: string | null;
  currentJobTitle: string | null;
  yearsOfExperience: number | null;
  employmentType: EmploymentType;
  linkedinUrl: string | null;
  cvPath: string | null;
  message: string | null;
  status: ApplicationStatus;
  assignedTo: string | null;
  internalNotes: string | null;
  lastContactedAt: string | null;
  privacyAccepted: boolean;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type JobApplicationsFilters = {
  search?: string;
  status?: "all" | ApplicationStatus;
  includeArchived?: boolean;
};

export type UpdateJobApplicationInput = {
  status?: ApplicationStatus;
  assignedTo?: string | null;
  internalNotes?: string | null;
  lastContactedAt?: string | null;
};

export type JobApplicationStats = {
  total: number;
  new: number;
  underReview: number;
  contacted: number;
  approved: number;
  rejected: number;
  archived: number;
};

export const APPLICATION_STATUS_LABELS_AR: Record<ApplicationStatus, string> = {
  new: "جديد",
  under_review: "قيد المراجعة",
  contacted: "تم التواصل",
  approved: "مقبول",
  rejected: "مرفوض",
  archived: "مؤرشف",
};

export const EMPLOYMENT_TYPE_LABELS_AR: Record<EmploymentType, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  remote: "عن بعد",
  internship: "تدريب",
  other: "أخرى",
};
