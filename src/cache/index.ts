import { CacheManager, Character, DbCacheAdapter, IDatabaseCacheAdapter } from "@gritlab/core";

export function initializeDbCache(
  character: Character,
  db: IDatabaseCacheAdapter
) {
  const cache = new CacheManager(new DbCacheAdapter(db, character.id));
  return cache;
}