'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const recipeSchema = mongoose.Schema({
    recipe_url: { type: String, required: true },
    title: { type: String, required: true },
    image_url: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})

recipeSchema.methods.serialize = function () {
    return {
        id: this._id,
        recipe_url: this.recipe_url,
        title: this.title,
        image_url: this.image_url,
        user: this.user
    };
};


const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = { Recipe };
