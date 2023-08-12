"use strict";

const express = require("express");
const router = express.Router();
const dropboxHelper = require("../helpers/dropboxHelper");

router.get('/authorize/dropbox', async (req, res) =>
{
    return res.redirect(dropboxHelper.authorize())
})

router.get('/authorize/redirect', async (req, res) =>
{
    return res.json(dropboxHelper.redirect(req.query.code))
})

router.get('/refresh-token', async (req, res) =>
{
    const refreshedAccessToken = await dropboxHelper.refreshAccessToken(process.env.DROPBOX_REFRESH_TOKEN)
    console.log('Refreshed Access Token:', refreshedAccessToken);

})

module.exports = router

