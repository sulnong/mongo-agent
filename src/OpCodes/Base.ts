import ref from 'ref-napi'
import { Signale } from 'signale'
export class Base {
  offset: number
  logger: Signale

  constructor() {
    this.offset = 0
    this.logger = new Signale({
      scope: 'Base',
      config: { displayTimestamp: true },
    })
  }
  // read a 32-bit integer from the buffer at the given offset
  readInt32LE(data: Buffer): number {
    const value = data.readInt32LE(this.offset)
    this.offset += 4
    return value
  }

  readUInt32LE(data: Buffer): number {
    const value = data.readUInt32LE(this.offset)
    this.offset += 4
    return value
  }

  readInt64LE(data: Buffer): number {
    const value = data.readInt64LE(this.offset)
    this.offset += 8
    return Number(value)
  }

  readUInt8(data: Buffer): number {
    const value = data.readUInt8(this.offset)
    this.offset += 1
    return value
  }

  // Returns a JavaScript String read from buffer at the given offset.
  // The C String is read until the first NULL byte,
  // which  indicates the end of the String.
  readCString(data: Buffer, offset = this.offset) {
    const cstring = ref.readCString(data, offset)
    this.offset += Buffer.byteLength(cstring, 'utf8') + 1
    return cstring
  }
}
