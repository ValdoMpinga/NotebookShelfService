const PdfModel = require('../models/pdfModel')

class pdfController
{
    constructor()
    {
        this.pdfModel = new PdfModel()
    }

    saveFile()
    {
        this.pdfModel.saveFile()
    }
}

module.exports = pdfController;
