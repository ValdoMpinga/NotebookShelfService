"use strict";

require('dotenv').config();

//imports
const pdfController = require('../controllers/pdfController');
const express = require("express");
const router = express.Router();
const upload = require('../utils/multerSetup');
const fs = require('fs');
const path = require('path');
const PdfHelper = require('../helpers/pdfHelper');
const pdfControllerInstance = new pdfController();
const { Dropbox } = require('dropbox');


const dbx = new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
})

router.route('/get').get((request, response) =>
{
    pdfControllerInstance.saveFile();
    response.status(200).send("Hello");
});


router.post('/create-notebook', upload.array('image', 50), async (req, res) =>
{
    const shelfName = req.body.shelfName;
    const notebookName = req.body.notebookName;

    if (!shelfName)
        return res.status(400).json({ error: 'shelfName not provided in the request body.' });


    if (!notebookName)
        return res.status(400).json({ error: 'notebookName not provided in the request body.' });
    
    if (!req.files || req.files.length === 0)
    {
        return res.status(400).json({ error: 'No images provided.' });
    }

    // Create an instance of the PdfHelper class
    const pdfHelper = new PdfHelper();

    // Save the images to "uploads/notebookName" directory
    pdfHelper.saveImagesToUserDir(notebookName, req.files);

    try
    {
        // Generate PDF
        const pdfPath = await pdfHelper.convertToPDF(shelfName,notebookName);
        pdfHelper.deleteUserDirectory(notebookName)

        return res.status(200).json({ message: 'PDF generated successfully.', pdfPath });

    } catch (error)
    {
        return res.status(500).json({ error });
    }
});

router.post('/add-pages-to-notebook', upload.array('image', 50), async (req, res) =>
{
    const shelfName = req.body.shelfName;
    const notebookName = req.body.notebookName;

    if (!shelfName)
        return res.status(400).json({ error: 'shelfName not provided in the request body.' });
    

    if (!notebookName)
        return res.status(400).json({ error: 'notebookName not provided in the request body.' });
    

    if (!req.files || req.files.length === 0)
    {
        return res.status(400).json({ error: 'No images provided.' });
    }

    try
    {
        // Create an instance of the PdfHelper class
        const pdfHelper = new PdfHelper();

        // Save the images to "uploads/notebookName" directory
        pdfHelper.saveImagesToUserDir(notebookName, req.files);

        // Add pages to the existing PDF
        const pdfPath = await pdfHelper.addPagesToPDF(shelfName, notebookName, req.files);
        pdfHelper.deleteUserDirectory(notebookName)


        return res.status(200).json({ message: 'Pages added to PDF successfully.', pdfPath });
    } catch (error)
    {
        return res.status(500).json({ error: error.message || 'Error adding pages to PDF.' });
    }
});



module.exports = router;
