import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { PlayerProfile } from '@tractor-royale/shared';

interface TractorRoyaleDB extends DBSchema {
  profiles: {
    key: string;
    value: PlayerProfile;
  };
  settings: {
    key: string;
    value: any;
  };
}

class IndexedDBStore {
  private db: IDBPDatabase<TractorRoyaleDB> | null = null;
  private readonly DB_NAME = 'tractor-royale';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    this.db = await openDB<TractorRoyaleDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'playerId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }

  async saveProfile(profile: PlayerProfile): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('profiles', profile);
  }

  async getProfile(playerId: string): Promise<PlayerProfile | undefined> {
    if (!this.db) await this.init();
    return await this.db!.get('profiles', playerId);
  }

  async getAllProfiles(): Promise<PlayerProfile[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('profiles');
  }

  async deleteProfile(playerId: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('profiles', playerId);
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('settings', value, key);
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init();
    return await this.db!.get('settings', key);
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear('profiles');
    await this.db!.clear('settings');
  }
}

export const indexedDBStore = new IndexedDBStore();
