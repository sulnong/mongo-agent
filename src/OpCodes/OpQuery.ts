import bson from 'bson'
import { Base } from './Base'

/**
 * MongoDB Protocol - OP_QUERY
 * See https://docs.mongodb.com/manual/reference/mongodb-wire-protocol/#op-query
 * for more information.
 */
export class OpQuery extends Base {
  flags: number
  collectionName: string
  numberToSkip: number
  numberToReturn: number
  returnCount: number
  query: bson.Document[]
  returnFieldsSelector: bson.Document[]

  constructor(data: Buffer) {
    super()
    console.log('Start read OpQuery...')
    this.flags = this.readInt32LE(data)
    this.collectionName = this.readCString(data)
    this.numberToSkip = this.readInt32LE(data)
    this.numberToReturn = this.readInt32LE(data)
    this.returnCount = this.numberToReturn
    this.returnFieldsSelector = []
    // bson deserialization
    let docs: bson.Document[] = []
    bson.deserializeStream(data, this.offset, 1, docs, this.numberToSkip, {})
    this.query = docs
    console.log('query', this.query)
    // We're not finished yet, which implies the optional returnFieldsSelector is set.
    if (this.offset < data.length) {
      let fields: bson.Document[] = []
      bson.deserializeStream(
        data,
        this.offset,
        1,
        fields,
        this.numberToSkip,
        {}
      )
      this.returnFieldsSelector = fields
    }
  }

  toString(): String {
    let result = ''
    if (this.flags > 0) {
      result += 'Flags: ' + this.flags + '\n'
    }
    if (this.query.length > 0) {
      result += 'Query: ' + JSON.stringify(this.query) + '\n'
    }
    if (this.returnFieldsSelector) {
      result +=
        'Return Fields: ' + JSON.stringify(this.returnFieldsSelector) + '\n'
    }
    return result
  }
}
