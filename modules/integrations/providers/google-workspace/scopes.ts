export const GOOGLE_WORKSPACE_SERVICE_SCOPES = {
  calendar: [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ],
  contacts: [
    "https://www.googleapis.com/auth/contacts.readonly",
    "https://www.googleapis.com/auth/contacts",
  ],
  gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.labels",
  ],
  sheets: [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ],
} as const;

export type GoogleWorkspaceService = keyof typeof GOOGLE_WORKSPACE_SERVICE_SCOPES;

export function getScopesForGoogleServices(services: GoogleWorkspaceService[]) {
  return [...new Set(services.flatMap((service) => GOOGLE_WORKSPACE_SERVICE_SCOPES[service]))];
}
