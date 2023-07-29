"use strict";

//imports
const pdfController = require('../controllers/pdfController');
const express = require("express");
const router = express.Router();
const upload = require('../utils/multerSetup');
const fs = require('fs');
const path = require('path');
const PdfHelper = require('../helpers/pdfHelper');

const pdfControllerInstance = new pdfController();

router.route('/get').get((request, response) =>
{
    pdfControllerInstance.saveFile();
    response.status(200).send("Hello");
});

router.post('/generate', upload.array('image', 50), async (req, res) =>
{
    const username = req.body.username;

    if (!username)
    {
        return res.status(400).json({ error: 'Username not provided.' });
    }

    if (!req.files || req.files.length === 0)
    {
        return res.status(400).json({ error: 'No images provided.' });
    }

    // Create an instance of the PdfHelper class
    const pdfHelper = new PdfHelper();

    // Save the images to "uploads/username" directory
    pdfHelper.saveImagesToUserDir(username, req.files);

    try
    {
        // Generate PDF
        const pdfPath = await pdfHelper.convertToPDF(username);
        pdfHelper.deleteUserDirectory(username)

        return res.status(200).json({ message: 'PDF generated successfully.', pdfPath });

    } catch (error)
    {
        return res.status(500).json({ error });
    }
});

router.post('/add-pages', upload.array('image', 50), async (req, res) =>
{
    const username = req.body.username;

    if (!username)
    {
        return res.status(400).json({ error: 'Username not provided.' });
    }

    if (!req.files || req.files.length === 0)
    {
        return res.status(400).json({ error: 'No images provided.' });
    }

    try
    {
        // Create an instance of the PdfHelper class
        const pdfHelper = new PdfHelper();

        // Save the images to "uploads/username" directory
        pdfHelper.saveImagesToUserDir(username, req.files);

        // Add images to the existing PDF
        const pdfPath = await pdfHelper.addImagesToPDF(username);

        return res.status(200).json({ message: 'Pages added to PDF successfully.', pdfPath });
    } catch (error)
    {
        return res.status(500).json({ error });
    }
});



module.exports = router;
