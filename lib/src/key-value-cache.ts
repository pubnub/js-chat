export class KeyValueCache<T> {
  cache: { [key: string]: T } = {}

  setNewRecord(key: string, record: T) {
    this.cache[key] = record
  }

  getRecord(key: string) {
    return this.cache[key]
  }
}
