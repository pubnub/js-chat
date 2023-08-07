import { ErrorLoggerImplementation } from "./types"
import { ERROR_LOGGER_KEY_PREFIX } from "./constants"

export class ErrorLogger {
  private errorLoggerImplementation: ErrorLoggerImplementation
  private creationDate: Date

  constructor(errorLoggerImplementation?: ErrorLoggerImplementation) {
    this.errorLoggerImplementation =
      errorLoggerImplementation ||
      new (class {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setItem() {}
        getItem() {
          return null
        }
        getStorageObject() {
          return {}
        }
      })()
    this.creationDate = new Date()
  }

  setItem(key: string, error: unknown, thrownFunctionArguments: IArguments) {
    if (!error) {
      return
    }
    const timestampKey = String(this.creationDate.getTime())
    const currentValue =
      this.errorLoggerImplementation.getItem(`${ERROR_LOGGER_KEY_PREFIX}_${timestampKey}`) || "[]"
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

    const serializedArguments: { [key: number]: string } = {}

    for (let i = 0; i < arguments.length; ++i) {
      if (typeof thrownFunctionArguments[i] === "function") {
        serializedArguments[i] = thrownFunctionArguments[i].name
      } else if (typeof thrownFunctionArguments[i] === "object") {
        serializedArguments[i] = thrownFunctionArguments[i].constructor.name
      } else if (typeof thrownFunctionArguments[i] === "symbol") {
        serializedArguments[i] = thrownFunctionArguments[i].toString()
      } else {
        serializedArguments[i] = thrownFunctionArguments[i]
      }
    }

    this.errorLoggerImplementation.setItem(
      `${ERROR_LOGGER_KEY_PREFIX}_${timestampKey}`,
      JSON.stringify([
        ...JSON.parse(currentValue),
        { key, error: errorToSave, thrownFunctionArguments: serializedArguments },
      ])
    )
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

    const file = new File(
      ["\ufeff" + JSON.stringify(storageObject)],
      `pubnub_debug_log_${this.creationDate}.txt`,
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
    get(target: T, prop: string, receiver: unknown) {
      if (typeof target[prop as keyof T] !== "function" || prop === "getUserSuggestions") {
        return target[prop as keyof T]
      }

      return function proxifiedFunction(...args: any[]) {
        const errorKey = `${target.constructor.name}:${String(prop)}`
        try {
          const reflectObject = Reflect.get(target, prop as keyof T, receiver) as (
            ...args: unknown[]
          ) => any

          const response = reflectObject.bind(target)(...args)

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
