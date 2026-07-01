export type SubscriberStatus = "ACTIVE" | "UNSUBSCRIBED";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  source: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberImportRow {
  email: string;
  name?: string;
  status?: string;
  source?: string;
}
