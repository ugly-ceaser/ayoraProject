export interface EmailMessage {
    id: string;
    subject?: string;
    from?: string;
    to?: string[];
    body?: string;
    receivedDateTime?: string;
    hasAttachments?: boolean;
    isRead?: boolean;
}