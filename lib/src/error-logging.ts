import { ErrorLoggerImplementation } from "./types";
import { ERROR_LOGGER_KEY_PREFIX }  from "./constants";
import { Chat } from "./entities/chat";

export class ErrorLogger {
  private errorLoggerImplementation: ErrorLoggerImplementation
  private creationDate: Date

  constructor(errorLoggerImplementation?: ErrorLoggerImplementation) {
    this.errorLoggerImplementation = errorLoggerImplementation || new class {
      setItem() {}
      getItem() { return null }
      removeItem() {}
      clear() {}
    }
    this.creationDate = new Date()
  }

  setItem(key: string, error: unknown) {
    if (!error) {
      return
    }
    const timestampKey = String(this.creationDate.getTime())
    const currentValue = this.errorLoggerImplementation.getItem(timestampKey) || '[]'

    this.errorLoggerImplementation.setItem(`${ERROR_LOGGER_KEY_PREFIX}_${timestampKey}`, JSON.stringify([ ...JSON.parse(currentValue), { key, error } ]))
  }

  getItem(key: string) {
    const item = this.errorLoggerImplementation.getItem(key)

    if (!item) {
      return null
    }

    return JSON.parse(item)
  }

  removeItem(key: string) {
    this.errorLoggerImplementation.removeItem(key)
  }

  clear() {
    this.errorLoggerImplementation.clear()
  }

  download(allKeys: string[]) {
    return allKeys.filter(key => key.startsWith(ERROR_LOGGER_KEY_PREFIX)).map(key => this.getItem(key))
  }
}

// type ClassRef = new (...args: any[]) => any;

export function getErrorProxiedEntity(baseEntity: Chat, errorLogger: ErrorLogger) {
  const  errorLoggerHandler = {
    get(target: Chat, prop: keyof Chat) {
      if (typeof target[prop] !== "function") {
        return target[prop]
      }

      return function () {
        try {
          // @ts-ignore
          return target[prop](...arguments)
        } catch(error) {
          console.log("error handler?")
          errorLogger.setItem("proxyError", error)
          throw error
        }
      }
    },
  }

  return new Proxy(baseEntity, errorLoggerHandler);
}
