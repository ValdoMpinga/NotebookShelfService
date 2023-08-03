"use strict";

require('dotenv').config();


//imports
const express = require("express");
const router = express.Router();
const upload = require('../utils/multerSetup');
const PdfHelper = require('../helpers/pdfHelper');
const { Dropbox } = require('dropbox');
const axios = require('axios');

const dbx = new Dropbox({
    accessToken: process.env.DROPBOX_API_KEY,
})

router.get('/getAccessToken', async (req, res) =>
{
    try
    {
        console.log(process.env.DROPBOX_API_KEY);
        console.log(process.env.DROPBOX_APP_SECRET);
        const tokenResponse = await dbx.auth.getAccessTokenFromCode(scopes);
        const accessToken = tokenResponse.result.access_token;

        // Now you have the access token to use for API requests
        console.log('Access Token:', accessToken);

        res.json({ accessToken });
    } catch (error)
    {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.route('/get').get((request, response) =>
{
    pdfControllerInstance.saveFile();
    response.status(200).send("Hello");
});


router.post('/create-notebook', upload.array('image', 50), async (req, res) =>
{
    const shelfName = '/' + req.body.shelfName;
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
        const pdfPath = await pdfHelper.convertToPDF(shelfName, notebookName);
        pdfHelper.deleteUserDirectory(notebookName)

        return res.status(200).json({ message: 'PDF generated successfully.', pdfPath });

    } catch (error)
    {
        return res.status(500).json({ error });
    }
});

router.post('/add-pages-to-notebook', upload.array('image', 50), async (req, res) =>
{
    const shelfName = '/' + req.body.shelfName;
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
        pdfHelper.deleteTemporaryNotebookDir(notebookName)


        return res.status(200).json({ message: 'Pages added to PDF successfully.', pdfPath });
    } catch (error)
    {
        return res.status(500).json({ error: error.message || 'Error adding pages to PDF.' });
    }
});


router.post('/delete-shelf', async (req, res) =>
{
    const shelfName = '/' + req.body.shelfName;

    console.log('bellow ');
    console.log(shelfName);
    if (!shelfName)
        return res.status(400).json({ error: 'shelfName not provided in the request body.' });

    try
    {
        const pdfHelper = new PdfHelper();

        // Save the images to "uploads/notebookName" directory
        const deleteResponse = await pdfHelper.deleteDropboxDirectory(shelfName);

        return res.status(200).json({ message: 'Shelf deleted successfully.', deleteResponse });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error deleting Shelf.' });
    }
});

router.post('/create-shelf', async (req, res) =>
{
    const shelfName = '/' + req.body.shelfName;

    console.log('Creating shelf:');
    console.log(shelfName);

    if (!shelfName)
    {
        return res.status(400).json({ error: 'shelfName not provided in the request body.' });
    }

    try
    {
        const pdfHelper = new PdfHelper();

        // Create the shelf on Dropbox
        const createResponse = await pdfHelper.createDropboxShelf(shelfName);

        return res.status(200).json({ message: 'Shelf created successfully.', createResponse });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error creating shelf.' });
    }
});


router.post('/update-shelf', async (req, res) =>
{
    const oldShelfName = '/' + req.body.oldShelfName;
    const newShelfName = '/' + req.body.newShelfName;

    console.log('Updating shelf:');
    console.log('Old Shelf Name:', oldShelfName);
    console.log('New Shelf Name:', newShelfName);

    if (!oldShelfName || !newShelfName)
    {
        return res.status(400).json({ error: 'Both oldShelfName and newShelfName must be provided in the request body.' });
    }

    try
    {
        const pdfHelper = new PdfHelper();

        // Update the shelf on Dropbox
        const moveResponse = await pdfHelper.createDropboxShelf(oldShelfName, newShelfName);

        return res.status(200).json({ message: 'Shelf renamed successfully.', moveResponse });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error renaming shelf.' });
    }
});

router.post('/delete-notebook', async (req, res) =>
{
    const shelfName = req.body.shelfName;
    const notebook = req.body.notebook;

    console.log('Deleting PDF:');
    console.log('Shelf Name:', shelfName);
    console.log('Notebook:', notebook);

    if (!shelfName || !notebook)
    {
        return res.status(400).json({ error: 'Both shelfName and notebook must be provided in the request body.' });
    }

    try
    {
        const pdfHelper = new PdfHelper();

        // Delete the PDF file on Dropbox
        const deleteResponse = await pdfHelper.deleteDropboxPDF(shelfName, notebook);

        return res.status(200).json({ message: 'PDF file deleted successfully.', deleteResponse });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error deleting PDF file.' });
    }
});

router.post('/rename-notebook', async (req, res) =>
{
    const shelfName = req.body.shelfName;
    const oldNotebook = req.body.oldNotebook;
    const newNotebook = req.body.newNotebook;

    console.log('Renaming PDF:');
    console.log('Shelf Name:', shelfName);
    console.log('Old Notebook:', oldNotebook);
    console.log('New Notebook:', newNotebook);

    if (!shelfName || !oldNotebook || !newNotebook)
    {
        return res.status(400).json({ error: 'Both shelfName, oldNotebook, and newNotebook must be provided in the request body.' });
    }

    try
    {
        const pdfHelper = new PdfHelper();

        // Rename the PDF file on Dropbox
        const moveResponse = await pdfHelper.renameDropboxPDF(shelfName, oldNotebook, newNotebook);

        return res.status(200).json({ message: 'PDF file renamed successfully.', moveResponse });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error renaming PDF file.' });
    }
});

router.get('/list-endpoints', async (req, res) =>
{
    try
    {
        const pdfHelper = new PdfHelper();

        // Log: Request received to list endpoints
        console.log('Received request to list endpoints');

        // List all endpoints on Dropbox
        const endpoints = await pdfHelper.listDropboxEndpoints();

        // Log: Endpoints successfully retrieved
        console.log('Endpoints retrieved successfully:', endpoints);

        return res.status(200).json({ endpoints });
    } catch (error)
    {
        // Log: Error occurred while listing endpoints
        console.error('Error listing endpoints:', error);

        return res.status(500).json({ message: 'Error listing endpoints.' });
    }
});


router.post('/list-files-in-folder', async (req, res) =>
{
    const shelfName = req.body.shelfName; // Get the shelfName from query parameters

    if (!shelfName)
    {
        return res.status(400).json({ error: 'shelfName must be provided as a query parameter.' });
    }

    try
    {
        const pdfHelper = new PdfHelper();

        // List all file names in the chosen folder on Dropbox
        const fileNames = await pdfHelper.listFilesInFolder(shelfName);

        return res.status(200).json({ fileNames });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error listing files in folder.' });
    }
});



module.exports = router;
