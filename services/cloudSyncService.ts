import { SiteConfig } from '../types';

const SYNC_URL = '/.netlify/functions/sync';

export const cloudSyncService = {
  /**
   * Fetches the config from MongoDB via the Netlify function.
   * Returns null on any failure to trigger localStorage fallback.
   */
  async fetchConfig(): Promise<SiteConfig | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${SYNC_URL}?action=get`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Cloud fetch failed with status: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      // A valid config must have the password hash
      if (data && data.adminPasswordHash) {
        return data as SiteConfig;
      }
      
      return null;
    } catch (e: any) {
      console.warn("CloudSyncService: Unable to reach database. Falling back to local.", e.message);
      return null;
    }
  },

  /**
   * Saves the config to MongoDB.
   */
  async saveConfig(config: SiteConfig): Promise<boolean> {
    try {
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', config })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("Cloud Save Failed:", err.error || response.statusText);
        return false;
      }

      return true;
    } catch (e) {
      console.error("CloudSyncService: Save error.", e);
      return false;
    }
  },

  /**
   * Migration helper to push local state to cloud.
   */
  async migrateToCloud(config: SiteConfig): Promise<boolean> {
    console.log("Migrating local data to MongoDB...");
    return this.saveConfig(config);
  }
};