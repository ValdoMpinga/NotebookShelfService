"use strict";

//imports
const pdfController = require('../controllers/pdfController');
const express = require("express");
const router = express.Router();
const upload = require('../utils/multerSetup');
const fs = require('fs');
const path = require('path');

const pdfControllerInstance = new pdfController();

router.route('/get').get((request, response) =>
{
    pdfControllerInstance.saveFile();
    response.status(200).send("Hello");
});

router.post('/generate', upload.array('image'), (req, res) =>
{
    const username = req.body.username;

    console.log(username);
    if (!username)
    {
        return res.status(400).json({ error: 'Username not provided.' });
    }

    if (!req.files || req.files.length === 0)
    {
        return res.status(400).json({ error: 'No images provided.' });
    }

    // Access the array of uploaded files using req.files
    // Save them to "uploads/username" directory

    const userDir = path.join('uploads', username);
    if (!fs.existsSync(userDir))
    {
        fs.mkdirSync(userDir, { recursive: true });
    }

    req.files.forEach((file) =>
    {
        const newPath = path.join(userDir, file.filename);
        fs.renameSync(file.path, newPath); // Move the file to the user directory
    });

    return res.status(200).json({ message: 'Images uploaded successfully.' });
});

module.exports = router;
