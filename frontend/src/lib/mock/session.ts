export type MockSession = {
  id: string;
  name: string;
  workgroup: string;
};

export const MOCK_SESSION: MockSession = {
  id: "demo-user",
  name: "avi",
  workgroup: "Workpunkt (497535504622)",
};

const STORAGE_KEY = "r53-mock-session";

export function getMockSession(): MockSession {
  if (typeof window === "undefined") return MOCK_SESSION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockSession;
  } catch {
    /* ignore */
  }
  return MOCK_SESSION;
}

export function ensureMockSession(): MockSession {
  if (typeof window === "undefined") return MOCK_SESSION;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SESSION));
  return MOCK_SESSION;
}
