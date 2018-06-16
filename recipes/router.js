'use strict';

require('dotenv').config();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { localStrategy, jwtStrategy } = require('../auth')
const passport = require('passport');
mongoose.Promise = global.Promise;
const { DATABASE_URL, PORT } = require('../config');
const { Recipe } = require('./models');
const { User } = require('../users')

const router = express.Router();

const jwtAuth = passport.authenticate('jwt', { session: false });

//Get the favorite recipes of a specific user
router.get('/', jwtAuth, (req, res) => {
    User
        .findOne({ username: req.user.username })
        .then(user => {
            return Recipe.find({ user })
        })
        .then(recipes => {
            res.json({
                recipes: recipes.map(
                    (recipe) => recipe.serialize())
            });
        })
        .catch(
        err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        });
});

//Create a new favorite recipe 
router.post('/', jwtAuth, jsonParser, (req, res) => {
    const requiredFields = ['image_url', 'recipe_url', 'title'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    //create new recipe from user
    Recipe.create({
        image_url: req.body.image_url,
        title: req.body.title,
        recipe_url: req.body.recipe_url,
        user: req.user.id
    })
        .then(newRecipe => res.status(201).json(newRecipe.serialize()))
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

//Delete recipe by id 
router.delete('/:id', jwtAuth, (req, res) => {
    Recipe.findByIdAndRemove(req.params.id)
        .then(() => {
            res.status(204).end();
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

module.exports = { router };