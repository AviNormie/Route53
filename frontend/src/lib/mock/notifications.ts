export type MockNotification = {
  id: string;
  resource: string;
  status: string;
  lastUpdate: string;
};

/** Empty by default to match the AWS console empty state. */
export const INITIAL_NOTIFICATIONS: MockNotification[] = [];
