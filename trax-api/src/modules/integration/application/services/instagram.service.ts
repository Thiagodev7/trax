import { Injectable } from '@nestjs/common';

interface IgCredentials {
  accessToken: string;
  igUserId: string; // Instagram Business Account ID
}

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

@Injectable()
export class InstagramService {
  private async graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${GRAPH_URL}/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Instagram API error: ${(err as any)?.error?.message ?? res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async fetchProfile(creds: IgCredentials): Promise<Record<string, unknown>> {
    const data = await this.graphGet<{
      id: string;
      name: string;
      biography?: string;
      followers_count: number;
      follows_count?: number;
      media_count: number;
      profile_picture_url?: string;
      username: string;
    }>(`${creds.igUserId}`, {
      fields: 'id,name,biography,followers_count,follows_count,media_count,profile_picture_url,username',
      access_token: creds.accessToken,
    });
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      biography: data.biography,
      followersCount: data.followers_count,
      followingCount: data.follows_count,
      mediaCount: data.media_count,
      profilePictureUrl: data.profile_picture_url,
    };
  }

  async fetchInsights(
    creds: IgCredentials,
    period: 'day' | 'week' | 'month' | 'lifetime' = 'month',
  ): Promise<Array<Record<string, unknown>>> {
    const metrics = ['reach', 'impressions', 'profile_views', 'follower_count', 'accounts_engaged', 'total_interactions', 'website_clicks'];
    const data = await this.graphGet<{
      data: Array<{ name: string; values: Array<{ value: number; end_time: string }> }>;
    }>(`${creds.igUserId}/insights`, {
      metric: metrics.join(','),
      period,
      access_token: creds.accessToken,
    });

    const byDate: Record<string, Record<string, number>> = {};
    for (const metric of data.data) {
      for (const v of metric.values) {
        const date = v.end_time.split('T')[0];
        if (!byDate[date]) byDate[date] = {};
        byDate[date][metric.name] = Number(v.value || 0);
      }
    }

    return Object.entries(byDate).map(([date, metrics]) => ({ date, ...metrics }));
  }

  async fetchMedia(
    creds: IgCredentials,
    limit = 50,
  ): Promise<Array<Record<string, unknown>>> {
    const data = await this.graphGet<{
      data: Array<{
        id: string;
        caption?: string;
        media_type: string;
        thumbnail_url?: string;
        media_url?: string;
        timestamp: string;
        like_count: number;
        comments_count: number;
        permalink: string;
      }>;
    }>(`${creds.igUserId}/media`, {
      fields: 'id,caption,media_type,thumbnail_url,media_url,timestamp,like_count,comments_count,permalink',
      limit: String(limit),
      access_token: creds.accessToken,
    });

    return data.data.map((m) => ({
      id: m.id,
      caption: m.caption,
      mediaType: m.media_type,
      thumbnailUrl: m.thumbnail_url ?? m.media_url,
      date: m.timestamp.split('T')[0],
      likeCount: m.like_count,
      commentsCount: m.comments_count,
      permalink: m.permalink,
    }));
  }

  async testConnection(creds: IgCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      const data = await this.graphGet<{ id: string; name: string; username: string }>(
        `${creds.igUserId}`,
        { fields: 'id,name,username', access_token: creds.accessToken },
      );
      return { valid: true, name: data.username };
    } catch {
      return { valid: false };
    }
  }
}
