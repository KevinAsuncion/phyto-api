"use strict";

exports.DATABASE_URL =
    process.env.DATABASE_URL || "mongodb://localhost/phyto";
exports.TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL || "mongodb://localhost/test-phyto";
exports.PORT = process.env.PORT || 8080;
exports.CLIENT_ORIGIN = "http://localhost:3000" || "https://optimistic-swartz-84bc04.netlify.com"  
exports.JWT_SECRET = process.env.JWT_SECRET || 'phyto'
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';