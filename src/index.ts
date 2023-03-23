import net from 'net'
import { now } from './utils'
import { Msg } from './msg'
import { EXTERNAL_PORT, MONGODB_HOST, MONGODB_PORT } from './constants'

const server: net.Server = net.createServer((socket: net.Socket) => {
  // specify client id
  // const clientId = socket.remoteAddress + ':' + socket.remotePort
  socket.on('data', (data) => {
    console.log(now(), ': data come in')
    const serviceSocket = new net.Socket()
    const msg = new Msg(data)
    // const packet = msg.packet
    // console.log(dayjs().format('YYYY/MM/DD HH:mm:ss'), packet)

    serviceSocket.connect(MONGODB_PORT, MONGODB_HOST, function () {
      // from agent to mongodb
      serviceSocket.write(data)
    })
    serviceSocket.on('data', function (data) {
      socket.write(data)
    })
  })
  socket.on('close', function () {
    console.log(now(), ': client disconnected.')
  })
})

server.listen(EXTERNAL_PORT, () => {
  console.log('server bound')
})
