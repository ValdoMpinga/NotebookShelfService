"use strict";

const express = require("express");
const router = express.Router();


// Define a ping endpoint that checks if an IP address is reachable
router.get('/get', (req, res) =>
{
    console.log("server is up!");
    res.status(200).json({ message: 'IP is reachable' });
});

module.exports = router
