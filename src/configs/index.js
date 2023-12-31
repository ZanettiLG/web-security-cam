require('dotenv').config();

const env = {
    IP: process.env.IP,
    USER: process.env.USER,
    PASS: process.env.PASS,
};

module.exports = env;