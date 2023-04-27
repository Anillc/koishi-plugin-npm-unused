import { Duplex } from 'stream'

export class DummyWriter extends Duplex {
  promise: Promise<Buffer>
  reject: (error: Error) => void
  private resolve: (text: Buffer) => void
  private chunks: Buffer[] = []

  constructor() {
    super()
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error) => void) {
    this.chunks.push(Buffer.from(chunk))
    callback()
  }

  _final(callback: (error?: Error) => void): void {
    this.resolve(Buffer.concat(this.chunks))
    callback()
  }

  _read() {
    this.push(null)
  }
}
