const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const MongoUtil = require("./MongoUtil");
const jwt = require('jsonwebtoken')

const mongoUrl = process.env.MONGO_URL;

let app = express();

// !! Enable processing JSON data
app.use(express.json());

// !! Enable CORS
app.use(cors());

// SETUP END
async function main() {
    const db = await MongoUtil.connect(MONGO_URI, "tgc18_food_sightings_jwt");
    console.log("Connected to database");
    app.get('/', function(req, res){
        res.send("hello world")
    })
    
}

main();

// START SERVER
app.listen(3000, () => {
  console.log("Server has started");
});
