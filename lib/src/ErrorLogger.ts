import { ErrorLoggerImplementation } from "./types";

export class ErrorLogger {
  private errorLoggerImplementation: ErrorLoggerImplementation
  private creationDate: Date

  constructor(errorLoggerImplementation?: ErrorLoggerImplementation) {
    this.errorLoggerImplementation = errorLoggerImplementation || new class {
      setItem() {}
      getItem() { return null }
      removeItem() {}
      clear() {}
      download() { return [] }
    }
    this.creationDate = new Date()
  }

  setItem(key: string, error: unknown) {
    if (typeof error !== "object") {
      console.warn("parameter 'error' is not an object.")
      console.warn("error is: ", error)
      return
    }
    const timestampKey = String(this.creationDate.getTime())
    const currentValue = this.errorLoggerImplementation.getItem(timestampKey) || '[]'

    this.errorLoggerImplementation.setItem(timestampKey, JSON.stringify([ ...JSON.parse(currentValue), { key, error } ]))
  }

  removeItem(key: string) {
    this.errorLoggerImplementation.removeItem(key)
  }

  clear() {
    this.errorLoggerImplementation.clear()
  }

  download() {
    this.errorLoggerImplementation.download()
  }
}
