import { Duplex } from 'stream'

export class StringWritable extends Duplex {
  promise: Promise<string>
  private resolve: (text: string) => void
  private reject: (error: Error) => void
  private result = ''

  constructor() {
    super()
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    this.on('close', () => this.resolve(this.result))
    this.on('error', this.reject)
  }

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error) => void) {
    this.result += chunk
    callback()
  }

  _read() {
    this.push(null)
  }
}
