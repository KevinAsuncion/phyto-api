'use strict';

//****************************************************
// Requires
//****************************************************
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const cors = require('cors');
const { PORT, DATABASE_URL } = require('./config');
const { CLIENT_ORIGIN } = require('./config');

const { localStrategy, jwtStrategy } = require('./auth')

// ****************************************************
// Passport
// ****************************************************

passport.use(localStrategy);
passport.use(jwtStrategy);

const jwtAuth = passport.authenticate('jwt', { session: false });

app.use(morgan('common'));
app.use(express.static('public'));


//****************************************************
// CORS
//****************************************************

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization")
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE")
    next()
})

//****************************************************
// Mongoose 
//****************************************************
mongoose.Promise = global.Promise; 

//****************************************************
// Routes
//****************************************************

const { router: usersRouter } = require('./users/router');
const { router: authRouter } = require('./auth/router');
const { router: recipesRouter } = require('./recipes/router');

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/recipes', recipesRouter);

app.use('*', (req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

//****************************************************
// Test Server 
//****************************************************

let server;

function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app
                .listen(port, () => {
                    console.log(`Your app is listening on port ${port}`);
                    resolve();
                })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };




