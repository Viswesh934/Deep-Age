export const env = {
  backendUrl: (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, ''),
  demoUrl: import.meta.env.VITE_DEMO_URL || 'http://127.0.0.1:3002',
};


