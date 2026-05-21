import { Injectable } from '@nestjs/common';

interface FbPageCredentials {
  accessToken: string; // Page Access Token
  pageId: string;
}

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

@Injectable()
export class FacebookPageService {
  private async graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${GRAPH_URL}/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Facebook Page API error: ${(err as any)?.error?.message ?? res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async fetchPageInfo(creds: FbPageCredentials): Promise<Record<string, unknown>> {
    const data = await this.graphGet<{
      id: string;
      name: string;
      fan_count: number;
      followers_count: number;
      category: string;
    }>(`${creds.pageId}`, {
      fields: 'id,name,fan_count,followers_count,category',
      access_token: creds.accessToken,
    });
    return {
      id: data.id,
      name: data.name,
      fanCount: data.fan_count,
      followersCount: data.followers_count,
      category: data.category,
    };
  }

  async fetchInsights(
    creds: FbPageCredentials,
    period: 'day' | 'week' | 'month' = 'day',
    since?: string,
    until?: string,
  ): Promise<Array<Record<string, unknown>>> {
    const metrics = ['page_impressions', 'page_reach', 'page_engaged_users', 'page_fans'];
    const params: Record<string, string> = {
      metric: metrics.join(','),
      period,
      access_token: creds.accessToken,
    };
    if (since) params.since = since;
    if (until) params.until = until;

    const data = await this.graphGet<{
      data: Array<{ name: string; values: Array<{ value: number; end_time: string }> }>;
    }>(`${creds.pageId}/insights`, params);

    const byDate: Record<string, Record<string, number>> = {};
    for (const metric of data.data) {
      for (const v of metric.values) {
        const date = v.end_time.split('T')[0];
        if (!byDate[date]) byDate[date] = {};
        byDate[date][metric.name] = Number(v.value || 0);
      }
    }

    return Object.entries(byDate).map(([date, m]) => ({ date, ...m }));
  }

  async fetchPosts(
    creds: FbPageCredentials,
    limit = 50,
  ): Promise<Array<Record<string, unknown>>> {
    const data = await this.graphGet<{
      data: Array<{
        id: string;
        message?: string;
        story?: string;
        created_time: string;
        full_picture?: string;
        permalink_url?: string;
        likes?: { summary: { total_count: number } };
        comments?: { summary: { total_count: number } };
        shares?: { count: number };
      }>;
    }>(`${creds.pageId}/posts`, {
      fields: 'id,message,story,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares',
      limit: String(limit),
      access_token: creds.accessToken,
    });

    return data.data.map((p) => ({
      id: p.id,
      caption: p.message ?? p.story ?? '',
      date: p.created_time.split('T')[0],
      thumbnailUrl: p.full_picture,
      permalink: p.permalink_url,
      likeCount: p.likes?.summary?.total_count ?? 0,
      commentsCount: p.comments?.summary?.total_count ?? 0,
      sharesCount: p.shares?.count ?? 0,
    }));
  }

  async testConnection(creds: FbPageCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      const data = await this.graphGet<{ id: string; name: string }>(
        `${creds.pageId}`,
        { fields: 'id,name', access_token: creds.accessToken },
      );
      return { valid: true, name: data.name };
    } catch {
      return { valid: false };
    }
  }
}
