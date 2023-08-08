import { ErrorLoggerImplementation, ErrorLoggerSetParams } from "./types"
import { ERROR_LOGGER_KEY_PREFIX } from "./constants"

export class ErrorLogger {
  private errorLoggerImplementation: ErrorLoggerImplementation
  private timestampKey: string

  constructor(errorLoggerImplementation?: ErrorLoggerImplementation) {
    this.timestampKey = String(`${ERROR_LOGGER_KEY_PREFIX}_${new Date().getTime()}`)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    this.errorLoggerImplementation =
      errorLoggerImplementation ||
      new (class {
        storage: { [timestamp: string]: ErrorLoggerSetParams[] } = {}

        setItem(
          key: string,
          params: { key: string; error: unknown; thrownFunctionArguments: IArguments }
        ) {
          if (!Object.keys(this.storage).length) {
            this.storage[self.timestampKey] = [
              {
                key: params.key,
                error: params.error,
                thrownFunctionArguments: params.thrownFunctionArguments,
              },
            ]
          } else {
            this.storage[self.timestampKey].push({
              key: params.key,
              error: params.error,
              thrownFunctionArguments: params.thrownFunctionArguments,
            })
          }
        }
        getStorageObject() {
          const serializedStorage: {
            [timestamp: string]: {
              key: string
              error: unknown
              thrownFunctionArguments: { [key: number]: string }
            }[]
          } = {}

          for (const storageItem in this.storage) {
            serializedStorage[storageItem] = this.storage[storageItem].map((errorLog) => {
              const serializedArguments: { [key: number]: string } = {}

              for (let i = 0; i < errorLog.thrownFunctionArguments.length; ++i) {
                if (typeof errorLog.thrownFunctionArguments[i] === "function") {
                  serializedArguments[i] = errorLog.thrownFunctionArguments[i].name
                } else if (typeof errorLog.thrownFunctionArguments[i] === "object") {
                  serializedArguments[i] = errorLog.thrownFunctionArguments[i].constructor.name
                } else if (typeof errorLog.thrownFunctionArguments[i] === "symbol") {
                  serializedArguments[i] = errorLog.thrownFunctionArguments[i].toString()
                } else {
                  serializedArguments[i] = errorLog.thrownFunctionArguments[i]
                }
              }

              return {
                key: errorLog.key,
                error: errorLog.error,
                thrownFunctionArguments: serializedArguments,
              }
            })
          }

          return serializedStorage
        }
      })()
  }

  setItem(key: string, error: unknown, thrownFunctionArguments: IArguments) {
    if (!error) {
      return
    }
    let errorToSave = error

    if (typeof error === "string") {
      errorToSave = error
    }
    if (error instanceof Error) {
      errorToSave = {
        name: error.name,
        message: error.message,
        // status comes from PubNub
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        status: error.status,
        // should we ignore "stack"?
        // stack: error.stack
      }
    }

    this.errorLoggerImplementation.setItem(this.timestampKey, {
      key,
      error: errorToSave,
      thrownFunctionArguments,
    })
  }

  getStorageObject() {
    const storageObject = this.errorLoggerImplementation.getStorageObject()
    console.log("storageObject", storageObject)

    const file = new File(
      ["\ufeff" + JSON.stringify(storageObject)],
      `pubnub_debug_log_${this.timestampKey}.txt`,
      { type: "text/plain:charset=UTF-8" }
    )

    const url = window.URL.createObjectURL(file)

    const a = document.createElement("a")
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    a.style = "display: none"
    a.href = url
    a.download = file.name
    a.click()
    window.URL.revokeObjectURL(url)
  }
}

export function getErrorProxiedEntity<T extends object>(baseEntity: T, errorLogger: ErrorLogger) {
  const errorLoggerHandler = {
    get(target: T, prop: string) {
      if (typeof target[prop as keyof T] !== "function") {
        return target[prop as keyof T]
      }

      const originalFunction = target[prop as keyof T] as (...args: any[]) => any

      return function proxifiedFunction(...args: any[]) {
        const errorKey = `${target.constructor.name}:${String(prop)}`
        try {
          const response = originalFunction.apply(this, args)

          if (response?.then) {
            return response
              .then((resolved: unknown) => {
                return resolved
              })
              .catch((error: unknown) => {
                errorLogger.setItem(errorKey, error, arguments)
                throw error
              })
          }

          return response
        } catch (error) {
          errorLogger.setItem(errorKey, error, arguments)
          throw error
        }
      }
    },
  }

  return new Proxy(baseEntity, errorLoggerHandler)
}
