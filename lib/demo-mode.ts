export const DEMO_MODE_DISABLED_MESSAGE = "Disabled in demo mode";

export class DemoModeBlockedError extends Error {
  constructor(message = DEMO_MODE_DISABLED_MESSAGE) {
    super(message);
    this.name = "DemoModeBlockedError";
  }
}

export function isDemoModeEnabled() {
  return process.env.DEMO_MODE === "true";
}

export function assertDemoModeWriteAllowed(message = DEMO_MODE_DISABLED_MESSAGE) {
  if (isDemoModeEnabled()) {
    throw new DemoModeBlockedError(message);
  }
}
