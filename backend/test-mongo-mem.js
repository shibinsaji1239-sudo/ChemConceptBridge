const { MongoMemoryServer } = require("mongodb-memory-server");

async function test() {
  try {
    console.log("Starting MongoMemoryServer...");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log("MongoMemoryServer started at:", uri);
    await mongod.stop();
    console.log("MongoMemoryServer stopped.");
  } catch (err) {
    console.error("MongoMemoryServer failed:", err);
  }
}

test();
