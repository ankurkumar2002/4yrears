
import { SiteConfig } from '../types';

const SYNC_URL = '/.netlify/functions/sync';

export const cloudSyncService = {
  /**
   * Attempts to fetch the config from MongoDB.
   * Throws an error if the connection fails.
   */
  async fetchConfig(): Promise<SiteConfig | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${SYNC_URL}?action=get`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      
      const data = await response.json();
      return data && data.adminPasswordHash ? data : null;
    } catch (e) {
      console.error("Cloud Fetch Failed:", e);
      throw new Error("Unable to connect to MongoDB. Check your Netlify Function or MONGODB_URI.");
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
      return response.ok;
    } catch (e) {
      console.error("Cloud Save Failed:", e);
      return false;
    }
  },

  /**
   * Migration helper to push local data to cloud once.
   */
  async migrate(config: SiteConfig): Promise<boolean> {
    return this.saveConfig(config);
  }
};
