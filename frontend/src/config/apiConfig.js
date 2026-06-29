/**
 * Shared API configuration.
 *
 * Uses Vite's import.meta.env for environment-specific overrides.
 * Set VITE_API_BASE in .env to point to a different backend.
 */
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
