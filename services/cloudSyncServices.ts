
import { SiteConfig } from '../types';

/**
 * Cloud Sync Service
 * Handles the migration from LocalStorage to a permanent Database.
 * 
 * NOTE: To fully connect to MongoDB, you should host a simple Netlify Function 
 * that uses your MONGODB_URI. This service points to that bridge.
 */

const SYNC_URL = '/.netlify/functions/sync-config'; // Standard path for Netlify Functions

export const cloudSyncService = {
  /**
   * Pushes local data to the cloud. Only called during initial migration.
   */
  async migrateToCloud(config: SiteConfig): Promise<boolean> {
    try {
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'migrate', config })
      });
      return response.ok;
    } catch (e) {
      console.warn("Cloud Sync Bridge not found. Defaulting to local persistence until hosted.", e);
      return false;
    }
  },

  /**
   * Fetches the latest config from the database.
   */
  async fetchConfig(): Promise<SiteConfig | null> {
    try {
      const response = await fetch(`${SYNC_URL}?action=get`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Saves config directly to the cloud.
   */
  async saveConfig(config: SiteConfig): Promise<boolean> {
    try {
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', config })
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
};
