import net from 'net'
import ref from 'ref-napi'
/**
 * MongoDB Protocol - Message Header
 */
class MsgHeader {
  messageLength: number
  requestID:number
  responseTo:number
  opCode: number

  constructor(msg: Buffer) {
    this.messageLength = msg.readInt32LE(0)
    this.requestID = msg.readInt32LE(4)
    this.responseTo = msg.readInt32LE(8)
    this.opCode = msg.readInt32LE(12)
  }
}

class OpQuery {
  offset: number
  constructor(data: Buffer, offset: number) {
    this.offset = offset
  }
}

class OpReply {
  offset: number
  constructor(data: Buffer, offset: number) {
    this.offset = offset
  }
}

class Msg {
  header: MsgHeader
  offset: number
  constructor(data: Buffer) {
    this.offset = 0
    // header length is 16 bytes
    this.header = new MsgHeader(data)
    this.offset += 16
    switch (this.header.opCode) {
      case 2004:
        new OpQuery(data, this.offset)
        break
      case 1:
        new OpReply(data, this.offset)
        break
      default:
        throw new Error('Unimplemented opcode ' + this.header.opCode)
    }
  }
  // Returns a JavaScript String read from buffer at the given offset.
  // The C String is read until the first NULL byte,
  // which  indicates the end of the String.
  readCString(data: Buffer, offset: number) {
    const cstring = ref.readCString(data, offset)
    offset += Buffer.byteLength(cstring, 'utf8') + 1
    return cstring
}
}

const server: net.Server = net.createServer((socket: net.Socket) => {
  const clientId = socket.remoteAddress + ':' + socket.remotePort
  const tag = '[' + clientId + '] '
  console.log(clientId + ' connected.')
  socket.on('data',(msg) => {
    //console.log('<< From client to proxy ', msg.toString());
    var serviceSocket = new net.Socket()
    console.log(clientId + ' -> Server:')
    var packet = parseMessage(msg, clientId)
    if (packet != null && packet instanceof OpQuery) {
      console.log(packet.query.toString())
      var fingerprint = ''
      if (packet.query && packet.query.length > 0 && packet.query[0].client) {
        fingerprint = packet.query[0].client
      }
      if (packet.query && packet.query.length > 0) {
        printFromAddress(clientId, 'login', JSON.stringify(packet.query[0]))
      } else {
        printFromAddress(clientId, JSON.stringify(packet.query[0]))
      }
    }
    serviceSocket.connect(MONGODB_PORT, MONGODB_HOST, function () {
      serviceSocket.write(msg)
    })
    serviceSocket.on('data', function (data) {
      //console.log('<< From remote to proxy', data.toString());
      //console.log("Server -> " + clientId + ":");
      parseMessage(data, clientId)
      printToAddress(clientId, data)
      socket.write(data)
      //console.log('>> From proxy to client', data.toString());
    })
  })
  socket.on('close', function () {
    console.log(clientId + ' disconnected.')
  })

})


function parseMessage(msg: Buffer, identifier: string) {
  const header = new MsgHeader(msg)
  //Only opcodes 2004(QUERY) and 1(REPLY) are currently implemented.
  //Though there are other opcodes, these are not used as frequently.
  //This should cover a decent amount of data.
  switch (header.opCode) {
    case 2004:
      var packet = new OpQuery(msg)
      printFromAddress(identifier, packet.toString())
      return packet
    case 1:
      var packet = new OpReply(msg)
      printFromAddress(identifier, packet.toString())
      return packet
    default:
      printFromAddress(identifier, 'Unimplemented opcode ' + header.opCode)
      printFromAddress(
        identifier,
        'Raw packet (' + header.opCode + '): \n' + msg.toString()
      )
      return null
  }
}



function printFromAddress(fromIp: string, data: string) {
  console.log('[' + fromIp + ' -> S] ' + data)
}

server.listen(8124, () => {
  console.log('server bound')
})
