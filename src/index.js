const path = require("path");
const express = require("express");
const { provideStream } = require("./stream");
const { IP, PASS } = require("./configs");

const app = express();

provideStream(app, IP, {pass: PASS});

/* app.use("/static", express.static("./public")); */

app.listen(3000, () => {
    console.log("http://localhost:3000");
});