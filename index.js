const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const MongoUtil = require("./MongoUtil");
const jwt = require('jsonwebtoken');
const e = require("express");

const MONGO_URI = process.env.MONGO_URI;

let app = express();
app.use(express.json());
app.use(cors());

async function main() {
    const db = await MongoUtil.connect(MONGO_URI, "tgc_project2");
    console.log("Connected to database");
    app.get('/', function (req, res) {
        res.send("hello world");
    })

    //search all
    app.get('/recipes/all', async function (req, res) {
        const allRecipes = await db.collection('recipes').find({}, { projection: { title: 1, cuisine: 1, diet: 1, serves: 1 } }).toArray();
        res.status(200);
        res.send(allRecipes);
    })

    //search by ID
    app.get('/recipes/find/:id', async function (req, res) {
        try {
            let id = req.params.id;
            const recipeRecord = await db.collection('recipes').findOne({ '_id': ObjectId(`${id}`) });
            res.status(200);
            res.json(recipeRecord);
        } catch (e) {
            res.status(400);
            res.json({ "mesage": "Error - Please check recipe id and try again" });
        }
    })

    //search with query string
    app.get('/recipes', async function (req, res) {
        try {
            let criteria = {};
            if (req.query.title) {
                criteria['title'] = {
                    '$regex': req.query.title, '$options': 'i'
                }
            }
            if (req.query.course) {
                let course = req.query.course.split(" ")
                criteria['course'] = {
                    '$in': course
                }
            }
            if (req.query.cuisine) {
                criteria['cuisine'] = {
                    '$regex': req.query.cuisine, '$options': 'i'
                }
            }
            if (req.query.diet) {
                let diet = req.query.diet.split(" ")
                criteria['diet'] = {
                    '$all': [diet]
                }
            }
            if (req.query.serves) {
                serves = parseInt(req.query.serves)
                criteria['serves'] = {
                    '$gte': serves
                }
            }
            let results = await db.collection('recipes').find(criteria, { projection: { title: 1, diet: 1, serves: 1 } }).toArray();
            res.status(200);
            // ! toArray() is async
            res.send(results);
        } catch (e) {
            res.json({
                "message": "Error - could not find results"
            })
        }
    })

    // user signup  
    app.post('/users/create', async function (req, res) {
        let email = req.body.email;
        let password = req.body.password;
        let user = await db.collection('users').findOne({
            'email': req.body.email
        })
        if (user) {
            res.status(400);
            res.json({
                'message': "This email already has an account!"
            });
        }
        else if (!email.includes('@') || !email.includes('.') || password.length < 8) {
            message = "";
            if (!email.includes('@') || !email.includes('.')) {
                message = message + "Email address is not valid. "
            }
            if (password.length < 8) {
                message = message + "Password must be 8 or more characters."
            }
            res.status(400);
            res.json({
                'message': message
            });
        }
        else {
            let newUser = {
                "email": req.body.email,
                "password": req.body.password,
            };
            await db.collection('users').insertOne(newUser);
            res.status(201);
            res.json({
                'message': "New user created!"
            });
        }
    })

    // login
    app.post('/login', async function (req, res) {
        // attempt to find a document with the same password and email given
        let user = await db.collection('users').findOne({
            'email': req.body.email,
            'password': req.body.password
        });
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
        try {
            let title = req.body.title;
            let ingredients = req.body.ingredients;
            let course = req.body.course;
            let cuisine = req.body.cuisine;
            let diet = req.body.diet;
            let serves = Number(req.body.serves);
            let method = req.body.method;
            if (title.length < 4 || !Array.isArray(ingredients) || !Array.isArray(course) && course.length < 3 || cuisine.length < 3 || diet && diet.length < 3 || !Number.isInteger(serves) || !Array.isArray(method)) {
                let message = "";
                if (title.length < 4) {
                    message = message + "Title must be at least 4 characters. ";
                }
                if (!Array.isArray(ingredients)) {
                    message = message + "Please enter ingredients as an array. ";
                }
                if (!Array.isArray(course) && course.length < 3) {
                    message = message + "Course must be at least 4 characters. ";
                }
                if (cuisine.length < 3) {
                    message = message + "Cuisine must be at least 3 characters. ";
                }
                if (diet && diet.length < 3) {
                    message = message + "If suitable for a certain diet, diet name must be at least 3 characters. ";
                }
                if (!Number.isInteger(serves)) {
                    message = message + "Please enter a valid serving size (must be a whole number). ";
                }
                if (!Array.isArray(method)) {
                    message = message + "Please enter recipe steps as an array."
                }
                res.status(400);
                res.json({
                    "message": message
                })
            } else {
                let result = await db.collection('recipes').insertOne({
                    "title": title,
                    "ingredients": ingredients,
                    "course": course,
                    "cuisine": cuisine,
                    "diet": diet,
                    "serves": serves,
                    "method": method,
                    "user_id": req.user.user_id
                });
                res.status(201);
                res.send(result);
            }
        } catch (e) {
            res.status(400);
            res.json({
                "message": "Error - Could not create recipe"
            });
        }

    })

    //update recipe
    app.put('/recipes/:id', checkIfAuthenticatedJWT, async function (req, res) {
        try {
            let id = req.params.id;
            let loginUserID = req.user.user_id;
            const recipeRecord = await db.collection('recipes').findOne({ '_id': ObjectId(`${id}`) });
            if (loginUserID == recipeRecord.user_id) {
                let message = ""
                if (req.body.title && req.body.title.length < 4) {
                    message = message + "Title must be at least 4 characters. ";
                }
                if (req.body.ingredients && !Array.isArray(req.body.ingredients)) {
                    message = message + "Please enter ingredients as an array. ";
                }
                if (req.body.course && !Array.isArray(req.body.course) && req.body.course.length < 3) {
                    message = message + "Course must be at least 4 characters. ";
                }
                if (req.body.cuisine && req.body.cuisine.length < 3) {
                    message = message + "Cuisine must be at least 3 characters. ";
                }
                if (req.body.diet && req.body.diet.length < 3) {
                    message = message + "If suitable for a certain diet, diet name must be at least 3 characters. ";
                }
                if (req.body.serves && !Number.isInteger(Number(req.body.serves))) {
                    message = message + "Please enter a valid serving size (must be a whole number). ";
                }
                if (req.body.method && !Array.isArray(req.body.method)) {
                    message = message + "Please enter recipe steps as an array."
                }
                if (message != "") {
                    res.status(400);
                    res.json({
                        "message": message
                    })
                } else{
                    let updates = {}
                    let fields=["title", "ingredients", "course", "cuisine","diet","serves","method"]
                    fields.map(function(e){
                        if (req.body[e]){
                           return updates[e]=req.body[e]
                        }
                    })
                    let results = await db.collection('recipes').updateOne({
                        '_id': ObjectId(req.params.id)
                    }, {
                        '$set': updates
                    });
                    res.status(200);
                    res.send(results);
                }
            } else {
            res.status(401);
            res.json({
                "message": "Unauthorised - you are not the owner of this recipe"
            });
        }
    } catch (e) {
        res.status(400);
        res.json({
            "message": "Error - Unable to edit this recipe"
        });
    }

})

//delete recipe
app.post('/recipes/delete/:id', checkIfAuthenticatedJWT, async function (req, res) {
    try {
        let id = req.params.id;
        let loginUserID = req.user.user_id;
        const recipeRecord = await db.collection('recipes').findOne({ '_id': ObjectId(`${id}`) });
        if (loginUserID == recipeRecord.user_id) {
            await db.collection('recipes').deleteOne({ '_id': ObjectId(id) })
            res.status(200)
            res.json({
                "message": "Recipe deleted!"
            })
        } else {
            res.status(401)
            res.json({
                "message": "Unauthorised - you are not the owner of this recipe"
            })
        }
    } catch (e) {
        res.status(400);
        res.json({
            "message": "Error - Unable to delete this recipe"
        });
    }
})
}

main();

// START SERVER
app.listen(3000, () => {
    console.log("Server has started");
});
