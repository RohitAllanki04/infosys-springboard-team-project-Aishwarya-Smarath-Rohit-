// Small helper utilities for handling JWT and user profile in localStorage
export const TOKEN_KEY = "token";
export const PROFILE_KEY = "profile";

export function saveToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function decodeToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode token', err);
    return null;
  }
}

export function getProfileFromToken(token) {
  const payload = decodeToken(token || getToken());
  if (!payload) return null;

  // Map common claim names to the profile shape used in the app
  return {
    id: payload.id || payload.sub || null,
    fullName: payload.fullName || payload.name || payload.username || "",
    companyName: payload.companyName || payload.org || "",
    email: payload.email || payload.sub || "",
    role: payload.role || payload.roles || "",
    contactNumber: payload.contactNumber || payload.phone || "",
    warehouseLocation: payload.warehouseLocation || payload.location || "",
  };
}

export function saveProfile(profile) {
  if (!profile) return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}
