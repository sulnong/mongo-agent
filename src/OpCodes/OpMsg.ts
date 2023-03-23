import bson from 'bson'
import { Base } from './Base'

export class OpMsg extends Base {
  flags: number
  sections: any[]
  constructor(data: Buffer) {
    super()
    this.flags = this.readUInt32LE(data)
    console.log('Flags bit: ', this.flags)
    this.sections = []
    console.log('Start read sections...')
    const kind = this.readUInt8(data)
    console.log('Section kind: ', kind)
    if (kind === 0) {
      // body
      console.log('Section kind: ', kind)
      let docs: bson.Document[] = []
      bson.deserializeStream(data, this.offset, 1, docs, 0, {})
      this.sections.push(docs[0])
      console.log('sections', this.sections)
    }

    let docs: bson.Document[] = []
  }
}
