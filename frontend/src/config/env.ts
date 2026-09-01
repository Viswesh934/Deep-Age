function getInitialBackendUrl(): string {
  if (typeof window !== 'undefined') {
    // 1. Check URL query parameter: ?backend=https://...
    const params = new URLSearchParams(window.location.search);
    const queryBackend = params.get('backend');
    if (queryBackend) {
      const clean = queryBackend.replace(/\/+$/, '');
      localStorage.setItem('DEEP_AGE_BACKEND_URL', clean);
      return clean;
    }
    // 2. Check localStorage persisted URL
    const saved = localStorage.getItem('DEEP_AGE_BACKEND_URL');
    if (saved) {
      return saved.replace(/\/+$/, '');
    }
  }
  // 3. Fallback to Vite build-time env variable
  return (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
}

export const env = {
  get backendUrl(): string {
    return getInitialBackendUrl();
  },
  setBackendUrl(url: string): void {
    if (typeof window !== 'undefined') {
      const clean = url.trim().replace(/\/+$/, '');
      if (clean) {
        localStorage.setItem('DEEP_AGE_BACKEND_URL', clean);
      } else {
        localStorage.removeItem('DEEP_AGE_BACKEND_URL');
      }
    }
  },
  demoUrl: import.meta.env.VITE_DEMO_URL || 'http://127.0.0.1:3002',
};

