require('dotenv').config();

const { Dropbox } = require('dropbox');

class PdfModel
{
    constructor()
    {

    }

    saveFile()
    {
        console.log("file saved");
    }
}


module.exports = PdfModel;
