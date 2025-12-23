const REDIRECT_STORAGE_KEY = 'intendedRoute';

// Persist the route a user wanted so we can restore it after login.
export const saveRedirectPath = (path) => {
  if (!path) return;
  // Avoid storing auth pages to prevent redirect loops.
  if (path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/auth')) return;
  sessionStorage.setItem(REDIRECT_STORAGE_KEY, path);
};

// Read the stored path without clearing it.
export const getStoredRedirectPath = () => sessionStorage.getItem(REDIRECT_STORAGE_KEY);

// Read and clear the stored path in one step.
export const consumeRedirectPath = (fallback = '/') => {
  const stored = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
  if (stored) {
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    return stored;
  }
  return fallback;
};

// Manually clear any stored redirect.
export const clearRedirectPath = () => {
  sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
};

