const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const MongoUtil = require("./MongoUtil");
const jwt = require('jsonwebtoken')

const MONGO_URI = process.env.MONGO_URI;

let app = express();

// !! Enable processing JSON data
app.use(express.json());
// !! Enable CORS
app.use(cors());

// SETUP END
async function main() {
    const db = await MongoUtil.connect(MONGO_URI, "tgc_project2");
    console.log("Connected to database");
    app.get('/', function (req, res) {
        res.send("hello world")
    })

    app.get('/recipes/find/:id', async function(req,res){
        let id=req.params.id
        const searchRecipe=await db.collection('recipes').findOne({'_id': ObjectId(`${id}`)})
        if(searchRecipe){
            displayRecipe=searchRecipe.toArray()
            res.status(200)
            res.send(displayRecipe)
        }
        else{
            res.status(404)
            res.json({"message":"No record found"})
        }
        
    })

    // user signup  
    app.post('/users', async function (req, res) {
        let email = req.body.email
        let password = req.body.password
        let user = await db.collection('users').findOne({
            'email': req.body.email
        })
        if (user) {
            res.status(400);
            res.json({
                'message': "This email already has an account!"
            })
        }
        else if (email.includes('@', '.') && password.length > 7) {
            let newUser = {
                "email": req.body.email,
                "password": req.body.password,
            }
            await db.collection('users').insertOne(newUser);
            res.status(201);
            res.json({
                'message': "New user created!"
            })
        }
        else {
            message = ""
            if (!email.includes('@', '.')) {
                message = message + "Email address is not valid. "
            }
            if (password.length <= 7) {
                message = message + "Password must be 8 or more characters."
            }
            res.status(400);
            res.json({
                'message': message
            })
        }
    })

    // login
    app.post('/login', async function (req, res) {
        // attempt to find a document with the same password and email given
        let user = await db.collection('users').findOne({
            'email': req.body.email,
            'password': req.body.password
        })
        // only if user is not undefined or not null
        if (user) {
            let token = jwt.sign({
                'email': req.body.email,
                'user_id': user._id
            }, process.env.TOKEN_SECRET, {
                'expiresIn': '1d'   // m for minutes, h for hours, w for weeks, d for days
            });
            res.json({
                'accessToken': token
            })
        } else {
            res.status(401);
            res.json({
                'message': "Invalid email or password"
            })
        }
    })

    //middleware to check authentication
    const checkIfAuthenticatedJWT = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];

            jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
                if (err) {
                    return res.sendStatus(403);
                    res.json({
                        message: "Unauthenticated token"
                    })
                }

                req.user = user;
                next();
            });
        } else {
            res.sendStatus(401);
        }
    };

    //check profile 
    app.get('/profile', checkIfAuthenticatedJWT, async function (req, res) {
        res.send(req.user);
    })

    //add recipe
    app.post('/recipes/create', checkIfAuthenticatedJWT, async function (req, res) {
        let result = await db.collection('recipes').insertOne({
            "title": req.body.title,
            "ingredients": req.body.ingredients,
            "course": req.body.course,
            "cuisine": req.body.cuisine,
            "diet": req.body.diet,
            "serves": req.body.serves,
            "method": req.body.method,
            "user_id":req.user.user_id
        })
        res.status(201); 
        res.send(result);
    })
}

main();

// START SERVER
app.listen(3000, () => {
    console.log("Server has started");
});
