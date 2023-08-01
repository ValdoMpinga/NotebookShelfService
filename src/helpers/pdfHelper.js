const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument, rgb } = require('pdf-lib');
const { Dropbox } = require('dropbox');
require('dotenv').config();

const dropboxMastersDir = '/Masters'; // The path to the "Masters" directory in the user's Dropbox

const dbx = new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
})
class PdfHelper
{
    saveImagesToUserDir(notebookName, files)
    {
        const userDir = path.join('uploads', notebookName);
        if (!fs.existsSync(userDir))
        {
            fs.mkdirSync(userDir, { recursive: true });
        }

        files.forEach((file) =>
        {
            const newPath = path.join(userDir, file.filename);
            fs.renameSync(file.path, newPath); // Move the file to the user directory
        });
    }


    async convertToPDF(notebookName)
    {
        const userDir = path.join('uploads', notebookName);
        const pdfPath = path.join('pdfs', `${notebookName}_notebook.pdf`);

        return new Promise((resolve, reject) =>
        {
            fs.readdir(userDir, async (err, files) =>
            {
                if (err)
                {
                    return reject('Error reading user directory.');
                }

                if (files.length === 0)
                {
                    return reject('No images found for the user.');
                }

                // Create the "pdfs" directory if it doesn't exist
                if (!fs.existsSync('pdfs'))
                {
                    fs.mkdirSync('pdfs');
                }

                // Create a new PDF document
                const doc = new PDFDocument();
                const writeStream = fs.createWriteStream(pdfPath);
                doc.pipe(writeStream);

                // Add each image to the PDF as a new page
                for (const [index, file] of files.entries())
                {
                    if (index > 0)
                    {
                        doc.addPage(); // Add a new page for each image except the first one
                    }

                    const imagePath = path.join(userDir, file);
                    doc.image(imagePath, {
                        fit: [500, 500],
                    });
                }

                // Finalize the PDF and close the write stream
                doc.end();
                writeStream.on('finish', async () =>
                {
                    console.log('PDF successfully written to file:', pdfPath);

                    try
                    {
                        // Initialize the Dropbox SDK with your access token

                        // Read the PDF file's contents
                        const pdfContents = fs.readFileSync(pdfPath);

                        // Upload the PDF to the "Masters" directory in the user's Dropbox account
                        const dropboxFilePath = dropboxMastersDir + `/${notebookName}_notebook.pdf`;
                        const uploadResponse = await dbx.filesUpload({
                            path: dropboxFilePath,
                            contents: pdfContents,
                        });

                        console.log('PDF uploaded to Dropbox:', uploadResponse);

                        // Resolve with the generated PDF file path
                        resolve(pdfPath);
                    } catch (dropboxError)
                    {
                        console.error('Error uploading PDF to Dropbox:', dropboxError);
                        reject('Error uploading PDF to Dropbox.');
                    }
                });

                writeStream.on('error', (err) =>
                {
                    console.error('Error writing PDF to file:', err);
                    reject('Error writing PDF to file.');
                });
            });
        });
    }

    deleteUserDirectory(notebookName)
    {
        const userDir = path.join('uploads', notebookName);

        if (fs.existsSync(userDir))
        {
            fs.rmdirSync(userDir, { recursive: true });
            console.log(`User directory "${userDir}" deleted successfully.`);
        } else
        {
            console.log(`User directory "${userDir}" not found.`);
        }
    }


    async addPagesToPDF(notebookName, newImages)
    {
        const userDir = path.join('uploads', notebookName);
        const existingPDFPath = path.join('pdfs', `${notebookName}_notebook.pdf`);

        try
        {
            // Download the existing PDF from Dropbox
            const dropboxFilePath = dropboxMastersDir + `/${notebookName}_notebook.pdf`;
            const downloadResponse = await dbx.filesDownload({ path: dropboxFilePath });
            const existingPDFBytes = downloadResponse.result.fileBinary;

            // Read the existing PDF using pdf-lib
            const existingPDF = await PDFLibDocument.load(existingPDFBytes);
            const { width, height } = existingPDF.getPage(0).getSize();

            // Append new pages with the new images to the existing PDF
            for (const newImage of newImages)
            {
                const page = existingPDF.addPage([width, height]);
                const imagePath = path.join(userDir, newImage.filename);
                const imageBytes = fs.readFileSync(imagePath);
                const image = await existingPDF.embedJpg(imageBytes);

                const imageWidth = image.width;
                const imageHeight = image.height;
                const scale = Math.min(width / imageWidth, height / imageHeight);

                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: imageWidth * scale,
                    height: imageHeight * scale,
                });
            }

            // Save the updated PDF
            const updatedPDFBytes = await existingPDF.save();

            // Upload the updated PDF back to Dropbox
            const uploadResponse = await dbx.filesUpload({
                path: dropboxFilePath,
                contents: updatedPDFBytes,
                mode: { '.tag': 'overwrite' },
            });

            console.log('Pages successfully added to existing PDF:', dropboxFilePath);

            return dropboxFilePath;
        } catch (error)
        {
            console.error('Error adding pages to existing PDF:', error);
            throw error;
        }
    }

    // async addPagesToPDF(notebookName, newImages)
    // {
    //     const userDir = path.join('uploads', notebookName);
    //     const existingPDFPath = path.join('pdfs',`${notebookName}_notebook.pdf`);

    //     if (!fs.existsSync(existingPDFPath))
    //     {
    //         throw new Error('Existing PDF file not found.');
    //     }

    //     // Read the existing PDF using pdf-lib
    //     const existingPDFBytes = fs.readFileSync(existingPDFPath);
    //     const existingPDF = await PDFLibDocument.load(existingPDFBytes);
    //     const { width, height } = existingPDF.getPage(0).getSize();

    //     // Append new pages with the new images to the existing PDF
    //     for (const newImage of newImages)
    //     {
    //         const page = existingPDF.addPage([width, height]);
    //         const imagePath = path.join(userDir, newImage.filename);
    //         const imageBytes = fs.readFileSync(imagePath);
    //         const image = await existingPDF.embedJpg(imageBytes);

    //         const imageWidth = image.width;
    //         const imageHeight = image.height;
    //         const scale = Math.min(width / imageWidth, height / imageHeight);

    //         page.drawImage(image, {
    //             x: 0,
    //             y: 0,
    //             width: imageWidth * scale,
    //             height: imageHeight * scale,
    //         });
    //     }

    //     // Save the updated PDF
    //     const updatedPDFBytes = await existingPDF.save();

    //     // Write the updated PDF back to the file
    //     fs.writeFileSync(existingPDFPath, updatedPDFBytes);

    //     console.log('Pages successfully added to existing PDF:', existingPDFPath);

    //     return existingPDFPath;
    // }
}

module.exports = PdfHelper;

