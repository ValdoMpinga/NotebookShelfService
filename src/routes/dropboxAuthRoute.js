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


module.exports = router

