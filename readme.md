# Recipes API Summary
## Context 

This project is created as an api for cooks who want to find share recipes. As a repository, it allows categorisation by course, serving size, type of cuisine and dietary restriction, etc. Users can search for recipes to suit their needs and add reviews to the recipes to let other users know if a recipe is good or not. 

The API was created on MongoDB and hosted on Heroku

Access the live demo site [here](https://tgcrecipeapi.herokuapp.com/)  

---

## User Goals
* As a cook, I want to find recipes by course to find appropriate recipes to cater to a specific event (e.g. snack, drink, dinner, dessert).
* As a cook, I want to find recipes by a minimum serving size to cater to a specific event.
* As a cook, I want to find recipes that are appropriate for particular dietary restrictions (e.g. vegan, kosher).
* As a cook, I want to find recipes by cuisine so I can cook learn a particular style of cooking (e.g. italian, chinese, etc).
* As a cook using the website, I want to leave reviews on the recipes to let others know if it was good.
* As a cook using the website, I want to update or delete my reviews if I change my mind about the review.
* As a cook using the website, I want to see reviews other people have left on the recipe, to see if it is worth making.
* As a cook, I want to be able to update or delete recipes I have posted if I improve or no longer like the recipe. 

---

## Features
- Search (all, specific recipe, and by parameters)
    - Users are able to get all recipes. Depending on page number, they will be able to see more results (in increments of 10)
    - Users are able to find all details of a specific recipe given its ID.
    - Users are able to search for recipes based on course, cuisine, minimum serving size, dietary restriction, or title.
- Create user 
    - Users can sign up for an account with their email and a password.
- Authentication and JSON webtoken
    - The following features require login from a user to provide a authenticated JSON webtoken.
-  User profile
    - Logged in users can view their own account details on a profile page. 
    - *Feature yet to be implemented: Adding references to recipe and review documents authored by the user.*
- Add, Update and Delete Recipe 
    - User can add a recipe to the database, specifying the title, ingredients, course, cuisine, serving size, dietary retriction and method for making it. The inserted recipe document also stores the user id. 
    - Only the user who authored the recipe can update or delete the recipe.
- Add, Update and Delete Review
    - User can add a review to a recipe, giving the review a title and message content, and rating the recipe on a scale of 1 to 5.
    - Only the user who authored the review can update or delete the review.

---

## Sample Mongo Documents
 **Recipe document**
```
{
    "_id": "6301d06dc19de67894aad1b6",
    "title": "Basil Pesto",
    "ingredients": [
        "1 clove garlic",
        "1 tsp kosher salt",
        "1 oz  pine nuts",
        "2 Cups (~1 ½ oz) basil leaves, packed (optionally blanched)",
        "1 ½  oz parmesan reggiano, grated",
        "2 ½ - 3 ½ oz extra virgin olive oil"
    ],
    "course": [
        "lunch",
        "dinner"
    ],
    "cuisine": "italian",
    "diet": [
        "halal",
        "kosher"
    ],
    "serves": 3,
    "method": [
        "Combine the garlic, salt, and nuts of choice in the bowl of a food processor. Pulse the ingredients until they are the consistency of sand.",
        "Add the herbs/greens and cheese to the food processor and process until the ingredients are combined.",
        "With the food processor running, slowly pour the olive oil down the feed spout. Continue processing until the sauce is thoroughly combined and homogenous.",
        "Use immediately or store the pesto in an airtight container. Before closing the lid, add a thin layer of olive oil on top of the pesto to prevent discoloring. Store in the refrigerator for up to 1 week."
    ],
    "user_id": "62ef62368eeefc844ffc238d",
    "reviews": [
        {
            "_id": "630a16f7e6a569c7141ef766",
            "title": "OMG",
            "rating": 5,
            "content": "wow so yummy",
            "user": {
                "_id": "6309a45b18d735e31476f4e4",
                "email": "cheese@gmail.com"
            }
        },
        {
            "_id": "630a173be6a569c7141ef767",
            "title": "it's food!",
            "rating": 5,
            "content": "its very food!",
            "user": {
                "_id": "62ef619f487ea95a545ac412",
                "email": "abc@gmail.com"
            }
        },
        {
            "_id": "630a2546b83e9bdf7894fa96",
            "title": "hmmm",
            "rating": 3,
            "content": "more food pls",
            "user": {
                "_id": "6301e101393848def7bb7a49",
                "email": "totoro@gmail.com"
            }
        }
    ]
}
```
**User Document**
```
{
  "_id": "6309a3024a5b39890c4c367b",
  "email": "icecream@gmail.com",
  "password": "icecream123"
}
```
---

## API documentation
Documentation can be viewed [here](https://github.com/clyerica/tgc-project2-restfulapi/blob/main/readme%20pdfs/API%20Documentation%20-%20tgcrecipeapi.pdf).

## Testing
Testing was done using [Advanced Rest Client Software](https://install.advancedrestclient.com/install).

Test cases can be viewed [here](https://github.com/clyerica/tgc-project2-restfulapi/blob/main/readme%20pdfs/API%20Test%20Cases%20-%20tgcrecipeapi.pdf)/

---

## Credits 
* [Node JS](https://nodejs.org/en/)
* [Express](https://expressjs.com) as the web framework for node js
* [Cross origin resource sharing](https://www.npmjs.com/package/cors) for providing a Connect/Express middleware 
* [MongoDB](https://www.mongodb.com) to build the API
* [Advanced Rest Client Software](https://install.advancedrestclient.com/install) for testing
* [Json webtoken](https://www.npmjs.com/package/jsonwebtoken) for authentication 
* [GitHub](http://github.com) for the repository
* [Visual Studio Code](https://code.visualstudio.com/) for editing code and visualising website on local server
* [Heroku](https://www.heroku.com/) for hosting the API
