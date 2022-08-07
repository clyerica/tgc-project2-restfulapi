const MongoClient = require('mongodb').MongoClient;

async function connect(mongoUri, dbName){
    const client = await MongoClient.connect(mongoUri, {
        "useUnifiedTopology": true // there were different versions of Mongo
                                  // when this is true we don't have to care about those versions
    })
    const db = client.db(dbName);
    return db
}

// module.exports allows other files to use the code here i guess?
module.exports={
    connect //'connect':connect - key is same as variable
} 