import net from 'net'
import { MONGODB_HOST, MONGODB_PORT } from './constants'
import { Signale } from 'signale'

const logger = new Signale({
  scope: 'Db Connection',
  config: { displayTimestamp: true },
})

function getDbConnection(): net.Socket {
  const conn = net.connect(MONGODB_PORT, MONGODB_HOST, () => {
    logger.info('Start a new connection to db')
    sendHandshake(conn)
  })

  conn.on('data', function (data) {
    console.log(data.toString())
  })

  conn.on('error', function (err) {
    logger.error(err)
  })

  conn.on('end', function () {
    logger.warn('Connection to db ended')
  })

  conn.on('close', function () {
    logger.warn('Connection to db closed')
  })

  return conn
}

function sendHandshake(conn: net.Socket) {
  const handShakeMessage = getHandShakeMessage()
  conn.write(handShakeMessage)
}

function getHandShakeMessage(): Buffer {
  return Buffer.from(
    '410100000100000000000000d40700000000000061646d696e2e24636d640000000000ffffffff1a0100001069736d617374657200010000000868656c6c6f4f6b000103636c69656e7400d7000000036472697665720029000000026e616d6500070000006e6f64656a73000276657273696f6e0006000000352e312e300000036f7300510000000274797065000700000044617277696e00026e616d65000700000064617277696e00026172636869746563747572650004000000783634000276657273696f6e000700000032302e362e30000002706c6174666f726d003e0000004e6f64652e6a73207631382e31332e302c204c452028756e6966696564297c4e6f64652e6a73207631382e31332e302c204c452028756e696669656429000004636f6d7072657373696f6e0011000000023000050000006e6f6e65000000',
    'hex'
  )
}

function sendSaslStartMessage() {
  // 构造 SASLStart 命令的 payload
  const saslStartPayload = {
    mechanism: 'SCRAM-SHA-256',
    payload: buildSaslStartPayload(),
  };


  // 构造整个命令
  const saslStartCommand = buildCommandMessage(1, saslStartPayload);


  // 发送命令
  socket.write(saslStartCommand);
}

function buildSaslStartPayload() {
  const clientNonce = generateNonce();
  return n,,n=${MONGODB_USERNAME},r=${clientNonce};
}

function buildNextSaslMessage(payload) {
  const serverFirstBare = payload.toString('utf8');
  const nonce = serverFirstBare.substr(serverFirstBare.indexOf('r=') + 2, 24);
  const salt = Buffer.from(serverFirstBare.substr(serverFirstBare.indexOf('s=') + 2), 'base64');
  const iterations = parseInt(serverFirstBare.match(/i=(\d+)/)[1]);


  const saltedPassword = generateSaltedPassword(MONGODB_USERNAME, MONGODB_PASSWORD, salt, iterations);
  const clientKey = hmacSha256(saltedPassword, 'Client Key');
  const storedKey = hashSha256(clientKey);


  const clientFinalWithoutProof = c=biws,r=${nonce};
  const serverFinalWithoutProof = r=${nonce},s=${salt.toString('base64')};


  const authMessage = ${clientFirstBare()},${serverFirstBare},${serverFinalWithoutProof};
  const clientSignature = hmacSha256(storedKey, authMessage).toString('base64');
  const clientProof = xorHex(clientKey, clientSignature);
  const clientFinal = ${clientFinalWithoutProof},p=${clientProof};


  return Buffer.from(clientFinal);
}

function generateNonce(length = 24) {
  return crypto.randomBytes(length).toString('base64');
}

function generateSaltedPassword(username, password, salt, iterations) {
  let result = new Uint8Array(hashSha256(${ username }: mongo: ${ password }));
  let u = new Uint8Array(result.length + salt.length + 4);
  u.set(result,)
}

getDbConnection()
