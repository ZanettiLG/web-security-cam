const path = require("path");
const express = require("express");
const { provideStream } = require("./stream");

const app = express();

provideStream(app, "192.168.3.80", {pass:"cazape1248"});

/* app.use("/static", express.static("./public")); */

app.listen(3000, () => {
    console.log("http://localhost:3000");
});