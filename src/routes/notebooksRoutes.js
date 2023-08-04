"use strict";

const express = require("express");
const router = express.Router();
const upload = require('../utils/multerSetup');
const NotebookHelper = require('../helpers/notebookHelper');

const notebookHelper = new NotebookHelper();

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

    // Save the images to "uploads/notebookName" directory
    notebookHelper.saveImagesToUploadDir(notebookName, req.files);

    try
    {
        // Generate PDF
        const pdfPath = await notebookHelper.convertImagesToPdfNotebook(shelfName, notebookName);
        notebookHelper.deleteTemporaryNotebookDir(notebookName)

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

        // Save the images to "uploads/notebookName" directory
        notebookHelper.saveImagesToUploadDir(notebookName, req.files);

        // Add pages to the existing PDF
        const pdfPath = await notebookHelper.addPagesToNotebook(shelfName, notebookName, req.files);
        notebookHelper.deleteTemporaryNotebookDir(notebookName)


        return res.status(200).json({ message: 'Pages added to PDF successfully.', pdfPath });
    } catch (error)
    {
        return res.status(500).json({ error: error.message || 'Error adding pages to PDF.' });
    }
});

router.post('/delete-notebook', async (req, res) =>
{
    const shelfName = req.body.shelfName;
    const notebookName = req.body.notebookName;

    console.log('Deleting PDF:');
    console.log('Shelf Name:', shelfName);
    console.log('Notebook:', notebookName);

    if (!shelfName || !notebookName)
    {
        return res.status(400).json({ error: 'Both shelfName and notebook must be provided in the request body.' });
    }

    try
    {
        // Delete the PDF file on Dropbox
        const deleteResponse = await notebookHelper.deleteNotebook(shelfName, notebookName);

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
        // Rename the PDF file on Dropbox
        const moveResponse = await notebookHelper.renameNotebook(shelfName, oldNotebook, newNotebook);

        return res.status(200).json({ message: 'PDF file renamed successfully.', moveResponse });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error renaming PDF file.' });
    }
});

router.post('/get-notebooks', async (req, res) =>
{
    const shelfName = req.body.shelfName; // Get the shelfName from query parameters

    if (!shelfName)
    {
        return res.status(400).json({ error: 'shelfName must be provided as a query parameter.' });
    }

    try
    {
        // List all file names in the chosen folder on Dropbox
        const fileNames = await notebookHelper.getNotebooks(shelfName);

        return res.status(200).json({ fileNames });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error listing files in folder.' });
    }
});

router.post('/get-notebook-content', async (req, res) =>
{
    const { shelfName, notebookName } = req.body;

    try
    {
        // Get the PDF content using the helper function
        const pdfContent = await notebookHelper.getNotebookContent(shelfName, notebookName);

        // Send the PDF content as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfContent.result.fileBinary);
    } catch (error)
    {
        console.error('Error fetching PDF content:', error);
        res.status(500).json({ error: 'Error fetching PDF content' });
    }
});

module.exports = router
