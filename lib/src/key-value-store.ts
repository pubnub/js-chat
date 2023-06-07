export class KeyValueStore<T> {
  cache: Map<string, T> = new Map()

  setNewRecord(key: string, record: T) {
    this.cache.set(key, record)
  }

  getRecord(key: string) {
    return this.cache.get(key)
  }
}
