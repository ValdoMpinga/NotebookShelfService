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

router.route('/createFolder').get((request, response) =>
{
    // createFolder()
    return response.status(200).json({ message: 'Req processed, check logs.' });

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
        return res.status(400).json({ error: 'Username not provided in the request body.' });
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

        // Add pages to the existing PDF
        const pdfPath = await pdfHelper.addPagesToPDF(username, req.files);
        pdfHelper.deleteUserDirectory(username)


        return res.status(200).json({ message: 'Pages added to PDF successfully.', pdfPath });
    } catch (error)
    {
        return res.status(500).json({ error: error.message || 'Error adding pages to PDF.' });
    }
});



async function createFolder()
{
    try
    {
        const folderName = 'Masters'; // Replace with the desired folder name

        const response = await dbx.filesCreateFolderV2({

            path: '/' + folderName, // Path where you want to create the folder, e.g., /New Folder
            autorename: false, // Set this to true to automatically rename the folder if a folder with the same name already exists
        });

        console.log('Folder created successfully:', response);
    } catch (error)
    {
        console.error('Error creating folder:', error);
    }
}

async function uploadFileToDirectory()
{
    try
    {
        const localFilePath = '/path/to/your/local/file.txt'; // Replace with the path to the file on your local machine
        const dropboxFolderPath = '/path/to/your/dropbox/folder'; // Replace with the path to the Dropbox folder you want to save the file in
        const fileName = 'myfile.txt'; // Replace with the desired file name in the Dropbox folder

        const fileContents = fs.readFileSync(localFilePath);

        const response = await dbx.filesUpload({
            path: dropboxFolderPath + '/' + fileName,
            contents: fileContents,
        });

        console.log('File uploaded successfully:', response);
    } catch (error)
    {
        console.error('Error uploading file:', error);
    }
}

module.exports = router;
