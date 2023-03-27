const { MongoClient } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
// const url = 'mongodb://root:password123@localhost:27016/?authSource=admin&directConnection=true';
const url = 'mongodb://root:password1232@localhost:27016/';
const client = new MongoClient(url, { connectTimeoutMS: 3000 });

// Database Name
const dbName = 'test';

async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection('test');

  // the following code examples can be pasted here...
  const findResult = await collection.find({}).toArray();
  console.log('Found documents =>', findResult);
  return 'done.';
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());