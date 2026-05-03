export interface EmailContact {
  email: string;
  name?: string;
}

export interface BrevoEmailParams {
  sender: EmailContact;
  to: EmailContact[];
  cc?: EmailContact[];
  bcc?: EmailContact[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  headers?: Record<string, string>;
  attachmentUrls?: string[];
  replyTo?: EmailContact;
}
