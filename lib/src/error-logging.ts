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
      getStorageObject() { return {} }
    }
    this.creationDate = new Date()
  }

  setItem(key: string, error: unknown, thrownFunctionArguments: IArguments) {
    if (!error) {
      return
    }
    const timestampKey = String(this.creationDate.getTime())
    const currentValue = this.errorLoggerImplementation.getItem(`${ERROR_LOGGER_KEY_PREFIX}_${timestampKey}`) || '[]'
    let errorToSave = error

    if (typeof error === "string") {
      errorToSave = error
    }
    if (error instanceof Error) {
      errorToSave = {
        name: error.name,
        message: error.message,
        // @ts-ignore
        status: error.status,
        // should we ignore "stack"?
        // stack: error.stack
      }
    }

    this.errorLoggerImplementation.setItem(`${ERROR_LOGGER_KEY_PREFIX}_${timestampKey}`, JSON.stringify([ ...JSON.parse(currentValue), { key, error: errorToSave, thrownFunctionArguments } ]))
  }

  getItem(key: string) {
    const item = this.errorLoggerImplementation.getItem(key)

    if (!item) {
      return null
    }

    return JSON.parse(item)
  }

  getStorageObject() {
    const storageObject = this.errorLoggerImplementation.getStorageObject()

    //create a file and put the content, name and type
    const file = new File(["\ufeff" + JSON.stringify(storageObject)], 'pubnub_debug_log.txt', {type: "text/plain:charset=UTF-8"});

    //create a ObjectURL in order to download the created file
    const url = window.URL.createObjectURL(file);

    //create a hidden link and set the href and click it
    const a = document.createElement("a");
    // @ts-ignore
    a.style = "display: none";
    a.href = url;
    a.download = file.name;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

export function getErrorProxiedEntity<T extends object>(baseEntity: T, errorLogger: ErrorLogger) {
  const  errorLoggerHandler = {
    get(target: T, prop: keyof T) {
      if (typeof target[prop] !== "function") {
        return target[prop]
      }

      return function () {
        const errorKey = `${target.constructor.name}:${String(prop)}`
        try {
          // @ts-ignore
          const response = target[prop](...arguments)

          if (response.then) {
            return response
              .then((resolved: any) => {
              return resolved
            })
              .catch((error: unknown) => {
                errorLogger.setItem(errorKey, error, arguments)
                throw error
              })
          }

          return response
        } catch(error) {
          errorLogger.setItem(errorKey, error, arguments)
          throw error
        }
      }
    },
  }

  // @ts-ignore
  return new Proxy(baseEntity, errorLoggerHandler);
}
