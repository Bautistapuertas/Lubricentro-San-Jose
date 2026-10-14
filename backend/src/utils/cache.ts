export interface CacheItem<T> {
  value: T;
  expiresAt: number;
  updatedAt: number;
}

export class Cache<T> {
  private readonly store = new Map<string, CacheItem<T>>();
  private readonly ttlMs: number;

  constructor(ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    item.updatedAt = Date.now();
    return item.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
      updatedAt: Date.now(),
    });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }
}
