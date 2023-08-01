require('dotenv').config();

// Import required packages
const express = require('express');
const bodyParser = require('body-parser');

//routes
const pdfRouter = require('./src/routes/pdf');

// Create an Express app
const app = express();

const cors = require('cors')

app.use(cors())

// Middleware to parse JSON requests
app.use(bodyParser.json());

app.listen(process.env.PORT, () => console.log(`server is listening on port ${process.env.PORT}`));

app.use('/pdf', pdfRouter);
