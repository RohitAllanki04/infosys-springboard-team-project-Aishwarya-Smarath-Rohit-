// Centralized role enum for the app
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  STORE_MANAGER: 'storemanager',
};

export function isAdmin(role) {
  return String(role || '').toLowerCase() === String(ROLES.ADMIN).toLowerCase();
}

export function isUser(role) {
  return String(role || '').toLowerCase() === String(ROLES.USER).toLowerCase();
}

export function isStoreManager(role) {
  return String(role || '').toLowerCase() === String(ROLES.STORE_MANAGER).toLowerCase();
}
