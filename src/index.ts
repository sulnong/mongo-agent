import net from 'net'
import { now } from './utils'
import { Msg } from './msg'
import { EXTERNAL_PORT, MONGODB_HOST, MONGODB_PORT } from './constants'
import { Signale } from 'signale'

const logger = new Signale({
  scope: 'Agent',
  config: { displayTimestamp: true },
})

const client2Agent = logger.scope('client2Agent')
const agent2Client = logger.scope('agent2Client')

const server: net.Server = net.createServer((socket: net.Socket) => {
  // 连接数据库
  const dbClient = net.connect(MONGODB_PORT, MONGODB_HOST, () => {
    logger.info('Agent has connected to mongodb')
  })
  // 监听数据库返回的数据
  dbClient.on('data', function (data) {
    agent2Client.debug('< < < < < < ====== < < < < < <: ')
    const msg = new Msg(data)
    socket.write(data)
  })
  // 监听客户端发来的数据
  const clientId = socket.remoteAddress + ':' + socket.remotePort
  socket.on('data', (data) => {
    client2Agent.debug('> > > > > > ====== > > > > > >: ', data.toString('hex'))
    const msg = new Msg(data)
    // 处理 Message
    const authData = ''
    // 认证 case
    dbClient.write(authData)
    // 数据库操作 case
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
  // 监听客户端连接错误
  socket.on('error', function (err) {
    console.log(now(), ': client error: ' + err)
  })
  // 监听数据库连接错误
  dbClient.on('error', function (err) {
    console.log(now(), ': dbClient error: ' + err)
  })
})

server.listen(EXTERNAL_PORT, () => {
  console.log('server bound')
})

function getDbConnection(): net.Socket {
  const conn = net.connect(MONGODB_PORT, MONGODB_HOST, () => {
    logger.info('Agent has connected to mongodb')
  })

  conn.on('data', function (data) {})

  conn.on('error', function (err) {
    console.log(now(), ': dbClient error: ' + err)
  })

  conn.on('end', function () {
    console.log(now(), ': client end.')
  })

  conn.on('close', function () {
    console.log(now(), ': client disconnected.')
  })

  return conn
}
