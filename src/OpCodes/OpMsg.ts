import bson from 'bson'
import { Base } from './Base'

/**
 * MongoDB Protocol - OP_MSG
 * See https://docs.mongodb.com/manual/reference/mongodb-wire-protocol/#op-msg for more information.
 *
 * Flag Bits:
 * The flagBits integer is a bitmask encoding flags that modify the format and behavior of OP_MSG.
 * The first 16 bits (0-15) are required and parsers MUST error if an unknown bit is set.
 * The last 16 bits (16-31) are optional, and parsers MUST ignore any unknown set bits. Proxies and other message
 * forwarders MUST clear any unknown optional bits before forwarding messages.
 *
 * 示例： range from 0 to 2^32-1 (0, 4294967295)
 *   0（默认值）- 普通消息
 *   1 - 消息是请求
 *   2 - 消息是响应
 *   3 - 消息是命令
 *   8 - 消息已标记为部署有 WriteConcern (此标志位可被设置，如果写关注不是默认级别)
 *   9 - 由 Op_Msg 将消息发送到单个目标（ 只有单个节点理解这个标志, 并只在发送到单个节点时设置该标志）
 *   255 - 消息是终止消息（即，这是一个空消息，用于在套接字上发送 EOF）
 *   256 - 消息是更新消息（即，消息包含一个或多个更新操作）
 *   65536 - Tailable Cursor（可追溯游标）消息
 *  注意：上述标志可以通过 or(|) 运算符进行组合使用，例如 0x08|0x01 表示带请求标志的写关注消息。
 *
 * Sections:
 * An OP_MSG message contains one or more sections. Each section starts with a kind byte indicating its type.
 * Everything after the kind byte constitutes the section's payload.
 */
export class OpMsg extends Base {
  flagBits: number
  sections: any[]
  constructor(data: Buffer) {
    super()
    this.logger = this.logger.scope('OpMsg')
    this.flagBits = this.readUInt32LE(data)
    this.sections = []
    const kind = this.readUInt8(data)
    /**
     * Kind 0: Body
     * A body section is encoded as a single BSON object. The size in the BSON object also serves as the size of the
     * section. This section kind is the standard command request and reply body.
     * All top-level fields MUST have a unique name.
     */
    if (kind === 0) {
      let docs: bson.Document[] = []
      bson.deserializeStream(data, this.offset, 1, docs, 0, {})
      // we sure docs have only one document
      this.sections.push(docs[0])
      this.singleBsonObjectParser(docs[0])
      return
    }

    /**
     * Kind 1: Document Sequence
     * int32 - Size of the section in bytes.
     * C String - Document sequence identifier. In all current commands this field is the (possibly nested) field
     *            that it is replacing from the body section.
     * Zero or more BSON objects
     *          - Objects are sequenced back to back with no separators.
     *          - Each object is limited to the maxBSONObjectSize of the server. The combination of
     *            all objects is not limited to maxBSONObjSize.
     *          - The document sequence ends once size bytes have been consumed.
     *          - Parsers MAY choose to merge these objects into the body as an array
     *            at the path specified by the sequence identifier when converting to
     *            language-level objects.
     */
    if (kind === 1) {
      console.log('Section kind: ', kind)
      const size = this.readUInt32LE(data)
      console.log('Section size: ', size)
      const identifier = this.readCString(data)
      console.log('Section identifier: ', identifier)
      return
    }

    /**
     * Kind 2: This section is used for internal purposes.
     */
    if (kind === 2) {
      console.log('Section kind: ', kind)
      return
    }
  }

  singleBsonObjectParser(doc: bson.Document) {
    // heart beat message
    if (doc.hasOwnProperty('ismaster') && doc.ismaster === 1) {
      this.logger.debug('Heart beat message')
      return
    }
    // query message
    if (doc.hasOwnProperty('$db')) {
      this.logger.debug('Query message: ', doc)
      return
    }
    this.logger.debug('Un-Category message: ', doc)
  }
}
