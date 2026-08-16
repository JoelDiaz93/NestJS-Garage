function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const config = {
  apiUrl: trimTrailingSlash(import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'),
  wsUrl: trimTrailingSlash(import.meta.env.VITE_WS_URL || 'http://localhost:3000/workshop'),
  demoEmail: import.meta.env.VITE_DEMO_EMAIL || 'admin@garageflow.local',
  freeHosting: String(import.meta.env.VITE_FREE_HOSTING || 'false').toLowerCase() === 'true',
};
