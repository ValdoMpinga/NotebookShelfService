"use strict";

//imports
const pdfController = require('../controllers/pdfController')
const express = require("express");
const router = express.Router();

const pdfControllerInstance = new pdfController();

router.route('/get').get((request, response) =>
{
    pdfControllerInstance.saveFile()
    response.status(200).send("Hello");
});

module.exports = router;
