'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');
const { User } = require('../users');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Users endpoint', function () {
    const username = 'exampleUser';
    const password = 'examplePass';
    const fullname = 'ExampleUser';

    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    after(function () {
        return closeServer();
    });

    beforeEach(function () { });

    afterEach(function () {
        return User.remove({});
    });

    describe('Users endpoint', function () {
        describe('POST', function () {
            it('Should reject users with missing username', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        password,
                        fullname,
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal('Missing field');
                        expect(res.body.location).to.equal('username');
                    });

            });
            it('Should reject users with missing password', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username,
                        fullname
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal('Missing field');
                        expect(res.body.location).to.equal('password');
                    });
            });
            it('Should reject users with non-string username', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username: 1234,
                        password,
                        fullname
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal(
                            'incorrect field type: expected string'
                        );
                        expect(res.body.location).to.equal('username');
                    });
            });
            it('Should reject users with non-string password', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username,
                        password: 1234,
                        fullname
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal(
                            'incorrect field type: expected string'
                        );
                        expect(res.body.location).to.equal('password');
                    });
            });
            it('Should reject users with non-string full name', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username,
                        password,
                        fullname: 1234,
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal(
                            'incorrect field type: expected string'
                        );
                        expect(res.body.location).to.equal('fullname');
                    });

            });
            it('Should reject users with non-trimmed username', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username: ` ${username} `,
                        password,
                        fullname
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal(
                            'cannot start or end with whitespace'
                        );
                        expect(res.body.location).to.equal('username');
                    });
            });
            it('Should reject users with non-trimmed password', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username,
                        password: ` ${password} `,
                        fullname
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal(
                            'cannot start or end with whitespace'
                        );
                        expect(res.body.location).to.equal('password');
                    });
            });
            it('Should reject users with empty username', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username: '',
                        password,
                        fullname,
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal(
                            'must be at least 1 characters long'
                        );
                        expect(res.body.location).to.equal('username');
                    });
            });
            it('Should reject users with password less than ten characters', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username,
                        password: '123456789',
                        fullname
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal(
                            'must be at least 10 characters long'
                        );
                        expect(res.body.location).to.equal('password');
                    });
            });
            it('Should reject users with password greater than 72 characters', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username,
                        password: new Array(73).fill('a').join(''),
                        fullname
                    })
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal(
                            'must be at most 72 characters long'
                        );
                        expect(res.body.location).to.equal('password');
                    });
            });
            it('Should reject users with duplicate username', function () {
                // Create an initial user
                return User.create({
                    username,
                    password,
                    fullname
                })
                    .then(() =>
                        // Try to create a second user with the same username
                        chai
                            .request(app)
                            .post('/users')
                            .send({
                                username,
                                password,
                                fullname
                            })
                    )
                    .then(res => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal('username already taken');
                        expect(res.body.location).to.equal('username');
                    });
            });
            it('Should create a new user', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username,
                        password,
                        fullname
                    })
                    .then(res => {
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.keys(
                            'username',
                            'fullname',
                            'id'
                        );
                        expect(res.body.username).to.equal(username);
                        expect(res.body.fullname).to.equal(fullname);
                        return User.findOne({
                            username
                        });
                    })
                    .then(user => {
                        expect(user).to.not.be.null;
                        expect(user.fullname).to.equal(fullname);
                        return user.validatePassword(password);
                    })
                    .then(passwordIsCorrect => {
                        expect(passwordIsCorrect).to.be.true;
                    });
            });
            it('Should trim fullname', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({
                        username,
                        password,
                        fullname: ` ${fullname} `,
                    })
                    .then(res => {
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.keys(
                            'username',
                            'fullname',
                            'id'
                        );
                        expect(res.body.username).to.equal(username);
                        expect(res.body.fullname).to.equal(fullname);
                        return User.findOne({
                            username
                        });
                    })
                    .then(user => {
                        expect(user).to.not.be.null;
                        expect(user.fullname).to.equal(fullname);
                    });
            });
        });
    });
});