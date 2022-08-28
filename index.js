const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const MongoUtil = require("./MongoUtil");
const jwt = require('jsonwebtoken');
const getUpdates = require("./getUpdates")

const MONGO_URI = process.env.MONGO_URI;

let app = express();
app.use(express.json());
app.use(cors());

async function main() {
    const db = await MongoUtil.connect(MONGO_URI, "tgc_project2");
    console.log("Connected to database");
    app.get('/', function (req, res) {
        res.status(200);
        res.json({
            message:"Hello world! Come look at recipes!"
        });
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
                    '$regex': req.query.title, 
                    '$options': 'i'
                };
            }
            if (req.query.course) {
                let course = req.query.course.split(" ")
                criteria['course'] = {
                    '$in': course
                };
            }
            if (req.query.cuisine) {
                criteria['cuisine'] = {
                    '$regex': req.query.cuisine, '$options': 'i'
                };
            }
            if (req.query.diet) {
                let diet = req.query.diet.split(" ");
                criteria['diet'] = {
                    $all: diet
                };
            }
            if (req.query.serves) {
                serves = parseInt(req.query.serves);
                criteria['serves'] = {
                    '$gte': serves
                };
            }
            let results = await db.collection('recipes').find(criteria, { projection: { title: 1, diet: 1, serves: 1 } }).toArray();
            res.status(200);
            res.send(results);
        } catch (e) {
            res.json({
                "message": "Error - could not find results"
            });
        }
    })

    // user signup  
    app.post('/users/create', async function (req, res) {
        let email = req.body.email;
        let password = req.body.password;
        let user = await db.collection('users').findOne({
            'email': req.body.email
        });
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
            };
            if (password.length < 8) {
                message = message + "Password must be 8 or more characters."
            };
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
        let user = await db.collection('users').findOne({
            'email': req.body.email,
            'password': req.body.password
        });
        if (user) {
            let token = jwt.sign({
                'email': req.body.email,
                'user_id': user._id
            }, process.env.TOKEN_SECRET, {
                'expiresIn': '1d'
            });
            res.json({
                'accessToken': token
            });
        } else {
            res.status(401);
            res.json({
                'message': "Invalid email or password"
            });
        }
    })

    // middleware to check authentication
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
        let userRecord = await db.collection('users').findOne({ '_id': ObjectId(`${req.user.user_id}`) });
        res.send(userRecord);
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
                });
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
    app.put('/recipes/:id/update', checkIfAuthenticatedJWT, async function (req, res) {
        try {
            let id = req.params.id;
            let loginUserID = req.user.user_id;
            const recipeRecord = await db.collection('recipes').findOne({ '_id': ObjectId(`${id}`) });
            if (loginUserID == recipeRecord.user_id) {
                let message = "";
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
                    message = message + "Please enter recipe steps as an array.";
                }
                if (message != "") {
                    res.status(400);
                    res.json({
                        "message": message
                    });
                } else {
                    let updates = getUpdates.updates(["title", "ingredients", "course", "cuisine", "diet", "serves", "method"], "",req);
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
    app.post('/recipes/:id/delete', checkIfAuthenticatedJWT, async function (req, res) {
        try {
            let id = req.params.id;
            let loginUserID = req.user.user_id;
            const recipeRecord = await db.collection('recipes').findOne({ '_id': ObjectId(`${id}`) });
            if (!recipeRecord) {
                res.status(400);
                res.json({
                    "message": "No recipe found"
                });
            } else if (loginUserID == recipeRecord.user_id) {
                await db.collection('recipes').deleteOne({ '_id': ObjectId(id) });
                res.status(200);
                res.json({
                    "message": "Recipe deleted!"
                });
            } else {
                res.status(401);
                res.json({
                    "message": "Unauthorised - you are not the owner of this recipe"
                });
            }
        } catch (e) {
            res.status(400);
            res.json({
                "message": "Error - Unable to delete this recipe"
            });
        }
    })

    //add review of recipe
    app.post('/recipes/:recipeId/reviews/add', checkIfAuthenticatedJWT, async function (req, res) {
        try {
            let id = req.params.recipeId;
            const recipeRecord = await db.collection('recipes').findOne({ '_id': ObjectId(`${id}`) });
            if (!recipeRecord) {
                res.status(404);
                res.json({
                    "message": "No recipe found"
                });
            } else {
                let title = req.body.title;
                let rating = parseInt(req.body.rating);
                let content = req.body.content;
                if (title.length < 3 || Number.isNaN(rating) || rating < 1 || rating > 5 || content.length < 3) {
                    message = "";
                    if (title.length < 3) {
                        message = message + "Title of review must be at least 3 characters. ";
                    }
                    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
                        message = message + "Please rate the recipe on a scale of 1 to 5. ";
                    }
                    if (content.length < 3) {
                        message = message + "Your review of the recipe must contain at least 3 characters.";
                    }
                    res.status(400);
                    res.json({
                        "message": message
                    });
                } else {
                    let result = await db.collection('recipes').updateOne({ '_id': ObjectId(`${id}`) },
                        {
                            '$push': {
                                'reviews': {
                                    '_id': ObjectId(),
                                    'title': title,
                                    'rating': rating,
                                    'content': content,
                                    'user': {
                                        '_id': req.user.user_id,
                                        'email': req.user.email,
                                    }
                                }
                            }
                        });
                    res.status(200);
                    res.send(result);
                }
            }
        } catch (e) {
            res.status(400);
            res.json({
                "message": "Error - Unable to add review to this recipe"
            });
        }
    })

    //update review of recipe
    app.put('/recipes/:recipeId/reviews/:reviewId/update', checkIfAuthenticatedJWT, async function (req, res) {
        let recipe_id = req.params.recipeId;
        let review_id = req.params.reviewId;
        let loginUserID = req.user.user_id;
        const reviewRecord = await db.collection('recipes').findOne({ '_id': ObjectId(`${recipe_id}`), 'reviews._id': ObjectId(`${review_id}`), 'reviews.user._id': loginUserID });
        if (!reviewRecord) {
            res.status(404);
            res.json({
                "message": "No review by you found for this recipe - cannot update"
            });
        } else {
            message = "";
            if (req.body.title && req.body.title.length < 3) {
                message = message + "Title of review must be at least 3 characters. ";
            }
            if (req.body.rating && (Number.isNaN(parseInt(req.body.rating)) || parseInt(req.body.rating) < 1 || parseInt(req.body.rating) > 5)) {
                message = message + "Please rate the recipe on a scale of 1 to 5. ";
            }
            if (req.body.content && req.body.content.length < 3) {
                message = message + "Your review of the recipe must contain at least 3 characters.";
            }
            if (message != "") {
                res.status(400);
                res.json({
                    "message": message
                });
            } else {
                let updates = getUpdates.updates(['title', 'rating', 'content'], "reviews.$.",req);
                let result = await db.collection('recipes').updateOne({
                    '_id': ObjectId(recipe_id),
                    'reviews._id': ObjectId(review_id)
                }, {
                    '$set': updates
                })
                res.status(200);
                res.send(result)
            }
        }
    })

    //delete recipe review
    app.post("/recipes/:recipeId/reviews/:reviewId/delete", checkIfAuthenticatedJWT, async function (req, res) {
        let recipe_id = req.params.recipeId;
        let review_id = req.params.reviewId;
        let loginUserID = req.user.user_id;
        const reviewRecord = await db.collection('recipes').findOne({ '_id': ObjectId(`${recipe_id}`), 'reviews._id': ObjectId(`${review_id}`), 'reviews.user._id': loginUserID });
        if (!reviewRecord) {
            res.status(404);
            res.json({
                "message": "No review by you found for this recipe - cannot delete"
            });
        } else {
            let results = await db.collection('recipes').updateOne({
                '_id': ObjectId(recipe_id)
            }, {
                '$pull': {
                    'reviews': {
                        '_id': ObjectId(review_id),
                        'user._id': loginUserID
                    }
                }
            });
            res.status(200);
            res.send(results);
        }
    })
}

main();

// START SERVER
app.listen(process.env.PORT||3000, () => {
    console.log("Server has started");
});
