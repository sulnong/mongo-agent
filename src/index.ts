import net from 'net'
import { now } from './utils'
import { Msg } from './msg'
import { EXTERNAL_PORT, MONGODB_HOST, MONGODB_PORT } from './constants'

const server: net.Server = net.createServer((socket: net.Socket) => {
  // 连接数据库
  const dbClient = net.connect(MONGODB_PORT, MONGODB_HOST, () => {
    console.log(now(), ': db client connected.')
  })
  // 监听数据库返回的数据
  dbClient.on('data', function (data) {
    console.log(now(), '< < < < < < ====== < < < < < <')
    const msg = new Msg(data)
    socket.write(data)
  })
  // 监听客户端发来的数据
  const clientId = socket.remoteAddress + ':' + socket.remotePort
  socket.on('data', (data) => {
    console.log(now(), '> > > > > > > ====== > > > > > >')
    const msg = new Msg(data)
    dbClient.write(data)
  })
  // 监听客户端连接结束
  socket.on('end', function () {
    console.log(now(), ': client end.')
  })
  // 监听客户端断开连接
  socket.on('close', function () {
    console.log(now(), ': client disconnected.')
  })
})

server.listen(EXTERNAL_PORT, () => {
  console.log('server bound')
})
