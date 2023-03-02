import net from 'net'
import ref from 'ref-napi'
import bson from 'bson'
import { EXTERNAL_PORT, MONGODB_HEADER_LENGTH, MONGODB_HOST, MONGODB_PORT } from './constants'


class Base {
  offset: number
  constructor() {
    this.offset = 0
  }
  // read a 32-bit integer from the buffer at the given offset
  readInt32LE(data: Buffer) : number {
    const value = data.readInt32LE(this.offset)
    this.offset += 4
    return value
  }

  // Returns a JavaScript String read from buffer at the given offset.
  // The C String is read until the first NULL byte,
  // which  indicates the end of the String.
  readCString(data: Buffer) {
    const cstring = ref.readCString(data, this.offset)
    this.offset += Buffer.byteLength(cstring, 'utf8') + 1
    return cstring
  }
}

/**
 * MongoDB Protocol - Message Header
 */
class MsgHeader extends Base{
  messageLength: number
  requestID:number
  responseTo:number
  opCode: number

  constructor(msg: Buffer) {
    super()
    this.messageLength = this.readInt32LE(msg)
    this.requestID = this.readInt32LE(msg)
    this.responseTo = this.readInt32LE(msg)
    this.opCode = this.readInt32LE(msg)
  }
}

/**
 * MongoDB Protocol - OP_QUERY
 * See https://docs.mongodb.com/manual/reference/mongodb-wire-protocol/#op-query
 * for more information.
 */
class OpQuery extends Base {
  flags: number
  collectionName: string
  numberToSkip: number
  numberToReturn: number
  returnCount: number
  query: bson.Document[]
  returnFieldsSelector: bson.Document[]
  
  constructor(data: Buffer) {
    super()
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
    // We're not finished yet, which implies the optional returnFieldsSelector is set.
    if (this.offset < data.length) {
      let fields: bson.Document[]  = []
      bson.deserializeStream(data, this.offset, 1, fields, this.numberToSkip, {})
      this.returnFieldsSelector = fields
    }
  }

  toString() : String {
    let result = ''
    if (this.flags > 0) {
      result += 'Flags: ' + this.flags + '\n'
    }
    if (this.query.length > 0) {
      result += 'Query: ' + JSON.stringify(this.query) + '\n'
    }
    if (this.returnFieldsSelector) {
      result += 'Return Fields: ' + JSON.stringify(this.returnFieldsSelector) + '\n'
    }
    return result
  }
}

class OpReply extends Base{
  constructor(data: Buffer) {
    super()
    // TODO 
  }
}

class Msg {
  header: MsgHeader
  packet: OpQuery | OpReply | null
  constructor(data: Buffer) {
    // Parse header
    this.header = new MsgHeader(data)
    // header length is 16 bytes, subarray to get the rest of the message
    let bodyData = data.subarray(MONGODB_HEADER_LENGTH)
    switch (this.header.opCode) {
      case 2004:
        this.packet = new OpQuery(bodyData)
        break
      case 1:
        this.packet = new OpReply(bodyData)
        break
      default:
        this.packet = null
        throw new Error('Unimplemented opcode ' + this.header.opCode)
    }
  }
}

const server: net.Server = net.createServer((socket: net.Socket) => {
  const clientId = socket.remoteAddress + ':' + socket.remotePort
  socket.on('data',(data) => {
    const serviceSocket = new net.Socket()
    console.log(clientId + ' -> Server:')
    const msg = new Msg(data)
    const packet = msg.packet
    if (packet != null && packet instanceof OpQuery) {
      console.log(packet.toString())
      var fingerprint = ''
      if (packet.query && packet.query.length > 0 && packet.query[0].client) {
        fingerprint = packet.query[0].client
      }
      if (packet.query && packet.query.length > 0) {
        // printFromAddress(clientId, 'login', JSON.stringify(packet.query[0]))
      } else {
        // printFromAddress(clientId, JSON.stringify(packet.query[0]))
      }
    }
    serviceSocket.connect(MONGODB_PORT, MONGODB_HOST, function () {
      serviceSocket.write(data)
    })
    serviceSocket.on('data', function (data) {
      //console.log('<< From remote to proxy', data.toString());
      //console.log("Server -> " + clientId + ":");
      const msg = new Msg(data)
      // printToAddress(clientId, data)
      socket.write(data)
      //console.log('>> From proxy to client', data.toString());
    })
  })
  socket.on('close', function () {
    console.log(clientId + ' disconnected.')
  })

})


function printFromAddress(fromIp: string, data: string) {
  console.log('[' + fromIp + ' -> S] ' + data)
}

server.listen(EXTERNAL_PORT, () => {
  console.log('server bound')
})
