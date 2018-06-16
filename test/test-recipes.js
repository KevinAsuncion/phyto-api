'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const faker = require('faker');
const { app, runServer, closeServer } = require('../server');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { User } = require('../users');
const { Recipe } = require('../recipes');

const expect = chai.expect;

chai.use(chaiHttp);

function seedRecipeData() {
    console.info('seeding recipe data');
    const seedData = [];
    for (var i = 1; i <= 10; i++) {
        seedData.push({
            image_url: faker.image.imageUrl(),
            title: faker.lorem.words(),
            recipe_url: faker.internet.url()
        });
    }
    return Recipe.insertMany(seedData);
}

function tearDownDb() {
    return new Promise((resolve, reject) => {
        console.warn('Deleting database');
        mongoose.connection
            .dropDatabase()
            .then(result => resolve(result))
            .catch(err => reject(err));
    });
}

describe('Recipes API', function () {

    const username = 'exampleUser';
    const password = 'examplePassword';
    const token = jwt.sign(
        {
            user: {
                username
            }
        },
        JWT_SECRET,
        {
            algorithm: 'HS256',
            subject: username,
            expiresIn: '7d'
        }
    );


    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function () {
        return seedRecipeData();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });

    describe('Protected endpoint', function () {
        it('Should reject request with no credentials', function () {
            return chai
                .request(app)
                .get('/recipes')
                .then(res => {
                    expect(res).to.have.status(401);
                })
        });
        it('Should reject requests with an invalid token', function () {
            const invalidToken = jwt.sign(
                {
                    user: username
                },
                'wrongSecret',
                {
                    algorithm: 'HS256',
                    subject: username,
                    expiresIn: '7d'
                }
            );
            return chai
                .request(app)
                .get('/recipes')
                .set('Authorization', `Bearer ${invalidToken}`)
                .then(res => {
                    expect(res).to.have.status(401);
                })
        });
    });


    describe('GET endpoint', function () {
        it('Should return all recipes', function () {
            let res
            return chai
                .request(app)
                .get('/recipes')
                .set('Authorization', `Bearer ${token}`)
                .then(_res => {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res.body.recipes).to.have.length.of.at.least(1);
                    return Recipe.count();
                })
                .then(count => {
                    expect(res.body.recipes).to.have.lengthOf(count);
                })

        });

        it('Should return recipes with the right fields', function () {
            let resRecipe;
            return chai
                .request(app)
                .get('/recipes')
                .set('Authorization', `Bearer ${token}`)
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body.recipes).to.be.a('array');
                    expect(res.body.recipes).to.have.length.of.at.least(1);

                    res.body.recipes.forEach(recipe => {
                        expect(recipe).to.be.a('object');
                        expect(recipe).to.include.keys(
                            'id',
                            'image_url',
                            'title',
                            'recipe_url'
                        );
                    });
                    resRecipe = res.body.recipes[0];
                    return Recipe.findById(resRecipe.id);
                })
                .then(recipe => {
                    expect(resRecipe.id).to.equal(recipe.id);
                    expect(resRecipe.image_url).to.equal(recipe.image_url);
                    expect(resRecipe.title).to.equal(recipe.title);
                    expect(resRecipe.recipe_url).to.equal(recipe.recipe_url);
                });
        });
    });

    describe('POST', function () {
        it('Should add a new recipe', function () {
            const newRecipe = {
                image_url: faker.image.imageUrl(),
                title: faker.lorem.words(),
                recipe_url: faker.internet.url(),
            }
            return chai
                .request(app)
                .post('/recipes')
                .set('Authorization', `Bearer ${token}`)
                .send(newRecipe)
                .then(function (res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys(
                        'id',
                        'image_url',
                        'title',
                        'recipe_url',
                    );
                    expect(res.body.id).to.not.be.null;
                    expect(res.body.image_url).to.equal(newRecipe.image_url);
                    expect(res.body.title).to.equal(newRecipe.title);
                    expect(res.body.recipe_url).to.equal(newRecipe.recipe_url);
                    return Recipe.findById(res.body.id);
                })
                .then(recipe => {
                    expect(recipe.image_url).to.equal(newRecipe.image_url);
                    expect(recipe.title).to.equal(newRecipe.title);
                    expect(recipe.recipe_url).to.equal(newRecipe.recipe_url);
                })

        });
    });

    describe('DELETE endpoint', function () {
        it('should delete recipe by id', function () {
            let recipe;

            return Recipe.findOne()
                .then(_recipe => {
                    recipe = _recipe;
                    return chai
                        .request(app)
                        .delete(`/recipes/${recipe.id}`)
                        .set('Authorization', `Bearer ${token}`);
                })
                .then(res => {
                    expect(res).to.have.status(204);
                    return Recipe.findById(recipe.id);
                })
                .then(_recipe => { 
                    expect(_recipe).to.be.null;
                });
        });
    });
})