require('dotenv').config();

// Import required packages
const express = require('express');
const bodyParser = require('body-parser');

//routes
const shelfRouter = require('./src/routes/shelfRoutes');
const notebookRouter = require('./src/routes/notebooksRoutes');

const app = express();

const cors = require('cors')

app.use(cors())

app.use(bodyParser.json());

app.listen(process.env.PORT, () => console.log(`server is listening on port ${process.env.PORT}`));

app.use('/shelf', shelfRouter);
app.use('/notebook', notebookRouter);
