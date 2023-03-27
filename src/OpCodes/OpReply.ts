import { Base } from './Base'
import bson from 'bson'

export class OpReply extends Base {
  flags: number
  cursorId: number
  startingFrom: number
  docCount: number
  documents: bson.Document[]
  constructor(data: Buffer) {
    super()
    this.logger = this.logger.scope('OpReply')
    this.flags = this.readInt32LE(data)
    this.cursorId = this.readInt64LE(data)
    this.startingFrom = this.readInt32LE(data)
    this.docCount = this.readInt32LE(data)
    let docs: bson.Document[] = []
    bson.deserializeStream(data, this.offset, 1, docs, 0, {})
    this.documents = docs
    this.logger.debug(docs)
  }
}
