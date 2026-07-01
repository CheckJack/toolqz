export const AFFILIATE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "APPLIED",
  "ACTIVE",
  "REJECTED",
  "PAUSED",
  "NOT_AVAILABLE",
  "ON_HOLD",
] as const;

export type AffiliateStatus = (typeof AFFILIATE_STATUSES)[number];

export const AFFILIATE_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type AffiliatePriority = (typeof AFFILIATE_PRIORITIES)[number];

export interface AffiliateUser {
  id: string;
  name: string;
  email: string;
}

export interface AffiliateTool {
  id: string;
  name: string;
  slug: string;
  published?: boolean;
}

export interface AffiliateActivity {
  id: string;
  affiliateId: string;
  userId: string | null;
  type: string;
  content: string;
  createdAt: string;
  user: AffiliateUser | null;
}

export interface AffiliateProgram {
  id: string;
  companyName: string;
  website: string | null;
  signupUrl: string | null;
  status: AffiliateStatus;
  priority: AffiliatePriority;
  category: string | null;
  commission: string | null;
  isRecurring: boolean | null;
  cookieDuration: string | null;
  affiliateNetwork: string | null;
  affiliateUrl: string | null;
  commissionNotes: string | null;
  notes: string | null;
  contactEmail: string | null;
  rejectionReason: string | null;
  applicationId: string | null;
  source: string | null;
  contactedAt: string | null;
  nextFollowUpAt: string | null;
  appliedAt: string | null;
  approvedAt: string | null;
  toolId: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: AffiliateUser | null;
  tool: AffiliateTool | null;
  activities?: AffiliateActivity[];
  _count?: { activities: number };
}

export interface AffiliateSeedInput {
  companyName: string;
  category?: string;
  commission?: string;
  isRecurring?: boolean | null;
  cookieDuration?: string;
  signupUrl?: string;
  website?: string;
  notes?: string;
  status?: AffiliateStatus;
  priority?: AffiliatePriority;
  affiliateNetwork?: string;
  source?: string;
  toolSlug?: string;
}

export interface AffiliateImportRow {
  companyName: string;
  category?: string;
  commission?: string;
  recurring?: string;
  cookieDuration?: string;
  signupUrl?: string;
  notes?: string;
  website?: string;
}
