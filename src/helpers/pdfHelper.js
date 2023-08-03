const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument, rgb } = require('pdf-lib');
const { Dropbox } = require('dropbox');
require('dotenv').config();

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


    async convertToPDF(shelfName, notebookName)
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
                        const dropboxFilePath = shelfName + `/${notebookName}_notebook.pdf`;
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

    async addPagesToPDF(shelfName, notebookName, newImages)
    {
        const userDir = path.join('uploads', notebookName);

        try
        {
            // Download the existing PDF from Dropbox
            const dropboxFilePath = shelfName + `/${notebookName}_notebook.pdf`;
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

    //Deletes the temporary directory used to store the images which were converted to pdf
    deleteTemporaryNotebookDir(notebook)
    {
        const notebookName = path.join('uploads', notebook);

        if (fs.existsSync(notebookName))
        {
            fs.rmdirSync(notebookName, { recursive: true });
            console.log(`Notebook directory "${notebookName}" deleted successfully.`);

            if (fs.existsSync('pdfs'))
                fs.rmdirSync('pdfs', { recursive: true });
        } else
        {
            console.log(`Notebook directory "${notebookName}" not found.`);
        }
    }

    async deleteDropboxDirectory(directoryPath)
    {
        try
        {
            console.log(directoryPath);
            // Delete the directory recursively and return the response
            const deleteResponse = await dbx.filesDeleteV2({
                path: directoryPath,
            });

            console.log('Dropbox directory deleted:', deleteResponse);
            return deleteResponse;
        } catch (dropboxError)
        {
            console.error('Error deleting Dropbox directory:', dropboxError);
            throw dropboxError;
        }
    }

    async createDropboxShelf(oldShelfName, newShelfName)
    {
        // Update the shelfName to be in the format '/Masters/shelfName'

        try
        {
            // Move/rename the shelf directory on Dropbox
            const moveResponse = await dbx.filesMoveV2({
                from_path: oldShelfName,
                to_path: newShelfName,
            });

            console.log('Dropbox shelf renamed:', moveResponse);
            return moveResponse;
        } catch (dropboxError)
        {
            console.error('Error renaming Dropbox shelf:', dropboxError);
            throw dropboxError;
        }
    }

    async deleteDropboxPDF(shelfName, notebook)
    {
        try
        {
            // Construct the path of the PDF file on Dropbox
            const pdfFilePath = `/${shelfName}/${notebook}_notebook.pdf`;

            console.log(pdfFilePath);
            // Delete the PDF file from Dropbox
            const deleteResponse = await dbx.filesDeleteV2({
                path: pdfFilePath,
            });

            console.log('PDF file deleted from Dropbox:', deleteResponse);
            return deleteResponse;
        } catch (dropboxError)
        {
            console.error('Error deleting PDF file from Dropbox:', dropboxError);
            throw dropboxError;
        }
    }

    async renameDropboxPDF(shelfName, oldNotebook, newNotebook)
    {
        try
        {
            // Construct the paths of the old and new PDF files on Dropbox
            const oldPdfFilePath = `/${shelfName}/${oldNotebook}_notebook.pdf`;
            const newPdfFilePath = `/${shelfName}/${newNotebook}_notebook.pdf`;

            // Rename the PDF file on Dropbox
            const moveResponse = await dbx.filesMoveV2({
                from_path: oldPdfFilePath,
                to_path: newPdfFilePath,
            });

            console.log('PDF file renamed on Dropbox:', moveResponse);
            return moveResponse;
        } catch (dropboxError)
        {
            console.error('Error renaming PDF file on Dropbox:', dropboxError);
            throw dropboxError;
        }
    }

    async listDropboxEndpoints(folderPath = '')
    {
        try
        {
            // Get the list of files and directories in the specified folder
            const listResponse = await dbx.filesListFolder({
                path: folderPath,
            });

            const endpoints = listResponse.result.entries.map((entry) => entry.name);
            return endpoints;
        } catch (dropboxError)
        {
            console.error('Error listing endpoints on Dropbox:', dropboxError);
            throw dropboxError;
        }
    }

    async listFilesInFolder(shelfName)
    {
        try
        {
            // Concatenate shelfName with a leading slash to form the folder path
            const folderPath = `/${shelfName}`;

            // Get the list of files and directories in the specified folder
            const listResponse = await dbx.filesListFolder({
                path: folderPath,
            });

            // Filter the list to get only the file names
            const fileNames = listResponse.result.entries
                .filter((entry) => entry['.tag'] === 'file')
                .map((entry) => entry.name);

            return fileNames;
        } catch (dropboxError)
        {
            console.error('Error listing files in folder on Dropbox:', dropboxError);
            throw dropboxError;
        }
    }


    // Function to renew the token
    async renewToken()
    {
        try
        {
            // Generate a new app token from the Dropbox Developer Console
            const NEW_APP_TOKEN = 'YOUR_NEW_APP_TOKEN';

            // Update the Dropbox instance with the new token
            dbx.setAccessToken(NEW_APP_TOKEN);

            // List files in the root directory as a test
            const response = await dbx.filesListFolder({ path: '' });
            const items = response.result.entries;
            renderItems(items);
        } catch (error)
        {
            console.error('Token renewal error:', error);
        }
    }

    // Render a list of items
    renderItems(items)
    {
        items.forEach(item =>
        {
            console.log(item.name);
        });
    }



}

module.exports = PdfHelper;

