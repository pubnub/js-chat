export class ExponentialRateLimiter {
  private baseInterval: number
  private exponentialFactor: number
  private isProcessing = false
  private currentPenalty = 0
  private queue: Array<{
    func: () => Promise<unknown>
    resolve: (result: unknown) => void
    reject: (error: unknown) => void
    penalty: number
  }> = []

  constructor(baseInterval: number, exponentialFactor: number) {
    this.baseInterval = baseInterval
    this.exponentialFactor = exponentialFactor
  }

  private wait(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout))
  }

  async runWithinLimits(func: () => Promise<unknown>): Promise<unknown> {
    if (this.baseInterval === 0) return func()
    if (this.isProcessing) this.currentPenalty += 1

    return new Promise((resolve, reject) => {
      this.queue.push({ func, resolve, reject, penalty: this.currentPenalty })
      if (!this.isProcessing) this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    const queueElement = this.queue.shift()

    if (!queueElement) {
      this.isProcessing = false
      this.currentPenalty = 0
      return
    }

    const { func, resolve, reject, penalty } = queueElement
    this.isProcessing = true

    try {
      const result = await func()
      resolve(result)
    } catch (error) {
      reject(error)
    }

    await this.wait(this.baseInterval * Math.pow(this.exponentialFactor, penalty))
    this.processQueue()
  }
}
