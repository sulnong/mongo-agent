import { MONGODB_HEADER_LENGTH } from './constants'
import { Base, OpMsg, OpQuery, OpReply } from './OpCodes'

/**
 * MongoDB Protocol - Message Header
 */
export class MsgHeader extends Base {
  messageLength: number
  requestID: number
  responseTo: number
  opCode: number

  constructor(msg: Buffer) {
    super()
    this.messageLength = this.readInt32LE(msg)
    this.requestID = this.readInt32LE(msg)
    this.responseTo = this.readInt32LE(msg)
    this.opCode = this.readInt32LE(msg)
  }
}

export class Msg {
  header: MsgHeader
  packet: OpMsg | OpQuery | OpReply | null
  constructor(data: Buffer) {
    // Parse header
    this.header = new MsgHeader(data)
    // header length is 16 bytes, subarray to get the rest of the message
    let bodyData = data.subarray(MONGODB_HEADER_LENGTH)
    switch (this.header.opCode) {
      case 2013:
        this.packet = new OpMsg(bodyData)
        break
      case 2004:
        this.packet = new OpQuery(bodyData)
        break
      case 1:
        this.packet = new OpReply(bodyData)
        break
      default:
        console.log('Unimplemented opcode ' + this.header.opCode)
        this.packet = null
        throw new Error('Unimplemented opcode ' + this.header.opCode)
    }
  }
}
