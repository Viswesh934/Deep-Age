export const env = {
  // In browser, empty string means relative paths (routed through Vite proxy or production domain)
  backendUrl: import.meta.env.VITE_BACKEND_URL || '',
  demoUrl: import.meta.env.VITE_DEMO_URL || 'http://127.0.0.1:3002',
};
