import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PlayerProfile } from '@tractor-royale/shared';

class SupabaseSync {
  private client: SupabaseClient | null = null;
  private enabled = false;

  init(supabaseUrl: string, supabaseKey: string): void {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.enabled = true;
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  async syncProfile(profile: PlayerProfile): Promise<void> {
    if (!this.isEnabled()) return;

    const { error } = await this.client!
      .from('profiles')
      .upsert({
        player_id: profile.playerId,
        username: profile.username,
        xp: profile.xp,
        level: profile.level,
        hay_bux: profile.hayBux,
        owned_parts: profile.ownedParts,
        equipped_tractor: profile.equippedTractor,
        statistics: profile.statistics,
        created_at: new Date(profile.createdAt).toISOString(),
        last_login_at: new Date(profile.lastLoginAt).toISOString(),
      });

    if (error) {
      console.error('Failed to sync profile:', error);
      throw error;
    }
  }

  async fetchProfile(playerId: string): Promise<PlayerProfile | null> {
    if (!this.isEnabled()) return null;

    const { data, error } = await this.client!
      .from('profiles')
      .select('*')
      .eq('player_id', playerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to fetch profile:', error);
      throw error;
    }

    return {
      playerId: data.player_id,
      username: data.username,
      xp: data.xp,
      level: data.level,
      hayBux: data.hay_bux,
      ownedParts: data.owned_parts,
      equippedTractor: data.equipped_tractor,
      statistics: data.statistics,
      createdAt: new Date(data.created_at).getTime(),
      lastLoginAt: new Date(data.last_login_at).getTime(),
    };
  }

  async getLeaderboard(limit = 100): Promise<any[]> {
    if (!this.isEnabled()) return [];

    const { data, error } = await this.client!
      .from('profiles')
      .select('player_id, username, xp, level, statistics')
      .order('xp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }

    return data || [];
  }

  disable(): void {
    this.enabled = false;
    this.client = null;
  }
}

export const supabaseSync = new SupabaseSync();
