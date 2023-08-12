"use strict";

const express = require("express");
const router = express.Router();
const ShelfHelper = require('../helpers/shelfHelper');
const shelfHelper = new ShelfHelper();

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

        // Create the shelf on Dropbox
        const createResponse = await shelfHelper.createShelf(shelfName);

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
        // Update the shelf on Dropbox
        const moveResponse = await shelfHelper.updateShelf(oldShelfName, newShelfName);

        return res.status(200).json({ message: 'Shelf renamed successfully.', moveResponse });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error renaming shelf.' });
    }
});

router.get('/get-shelves', async (req, res) =>
{
    try
    {
        const endpoints = await shelfHelper.getShelfs();

        return res.status(200).json({ endpoints });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error getting shelves.' });
    }
});

router.post('/delete-shelf', async (req, res) =>
{
    const shelfName = '/' + req.body.shelfName;

    if (!shelfName)
        return res.status(400).json({ error: 'shelfName not provided in the request body.' });

    try
    {
        // Save the images to "uploads/notebookName" directory
        const deleteResponse = await shelfHelper.deleteShelf(shelfName);

        return res.status(200).json({ message: 'Shelf deleted successfully.', deleteResponse });
    } catch (error)
    {
        return res.status(500).json({ message: 'Error deleting Shelf.' });
    }
});


module.exports = router
