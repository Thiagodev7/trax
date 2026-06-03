import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private _connected = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL não configurada — Redis desativado. Usando cache em memória.');
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
    });
    this.client.on('connect', () => {
      this._connected = true;
      this.logger.log('Redis conectado.');
    });
    this.client.on('error', (err) => {
      this._connected = false;
      this.logger.error(`Redis erro: ${err.message}`);
    });
    this.client.connect().catch(() => {/* handled by error event */});
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  get isConnected(): boolean {
    return this._connected;
  }

  async get(key: string): Promise<string | null> {
    if (!this._connected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this._connected) return;
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch { /* silent — cache is best-effort */ }
  }

  async del(key: string): Promise<void> {
    if (!this._connected) return;
    try {
      await this.client.del(key);
    } catch { /* silent */ }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this._connected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch { /* silent */ }
  }
}
