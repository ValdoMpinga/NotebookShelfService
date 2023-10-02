"use strict";

const { Dropbox } = require('dropbox');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument, rgb } = require('pdf-lib');
const tokenManagerInstance = require('../token/tokenManager')

class NotebookHelper
{
    constructor()
    {
        this.accessToken = tokenManagerInstance.getAccessToken();
        this.dbx = new Dropbox({
            accessToken: this.accessToken,
            refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
        });
    }

    async refreshAccessTokenIfNeeded()
    {
        const currentAccessToken = tokenManagerInstance.getAccessToken();
        if (currentAccessToken !== this.accessToken)
        {
            this.accessToken = currentAccessToken;
            this.dbx = new Dropbox({
                accessToken: this.accessToken,
            });
        }
    }

    async convertImagesToPdfNotebook(shelfName, notebookName)
    {
        const userDir = path.join('uploads', notebookName);
        const pdfPath = path.join('pdfs', `${notebookName}_notebook.pdf`);

        await this.refreshAccessTokenIfNeeded();

        return new Promise(async (resolve, reject) =>
        {
            try
            {
                const files = await fs.promises.readdir(userDir);

                if (files.length === 0)
                {
                    return reject('No images found for the user.');
                }

                if (!fs.existsSync('pdfs'))
                {
                    fs.mkdirSync('pdfs');
                }

                const doc = new PDFDocument();
                const writeStream = fs.createWriteStream(pdfPath);
                doc.pipe(writeStream);

                for (const [index, file] of files.entries())
                {
                    if (index > 0)
                    {
                        doc.addPage(); // Add a new page for each image except the first one
                    }

                    const imagePath = path.join(userDir, file);
                    doc.image(imagePath, {
                        width: doc.page.width,
                        height: doc.page.height,
                    });
                }

                doc.end();
                writeStream.on('finish', async () =>
                {
                    console.log('PDF successfully written to file:', pdfPath);

                    try
                    {
                        // Read the PDF file's contents
                        const pdfContents = fs.readFileSync(pdfPath);

                        // Upload the PDF to the "Masters" directory in the user's Dropbox account
                        const dropboxFilePath = shelfName + `/${notebookName}_notebook.pdf`;
                        const uploadResponse = await this.dbx.filesUpload({
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
            } catch (err)
            {
                console.error('Error reading user directory:', err);
                reject('Error reading user directory.');
            }
        });
    }


    async addPagesToNotebook(shelfName, notebookName, newImages)
    {
        try
        {
            const userDir = path.join('uploads', notebookName);
            await this.refreshAccessTokenIfNeeded();

            // Download the existing PDF from Dropbox
            const dropboxFilePath = shelfName + `/${notebookName}_notebook.pdf`;
            const downloadResponse = await this.dbx.filesDownload({ path: dropboxFilePath });
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

                // Calculate the position to center the image
                const xPos = (width - imageWidth * scale) / 2;
                const yPos = (height - imageHeight * scale) / 2;

                page.drawImage(image, {
                    x: xPos,
                    y: yPos,
                    width: imageWidth * scale,
                    height: imageHeight * scale,
                });
            }

            // Save the updated PDF
            const updatedPDFBytes = await existingPDF.save();

            // Upload the updated PDF back to Dropbox
            const uploadResponse = await this.dbx.filesUpload({
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


    async renameNotebook(shelfName, oldNotebook, newNotebook)
    {
        try
        {
            await this.refreshAccessTokenIfNeeded();


            // Construct the paths of the old and new PDF files on Dropbox
            const oldPdfFilePath = `/${shelfName}/${oldNotebook}_notebook.pdf`;
            const newPdfFilePath = `/${shelfName}/${newNotebook}_notebook.pdf`;

            // Rename the PDF file on Dropbox
            const moveResponse = await this.dbx.filesMoveV2({
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

    deleteTemporaryNotebookDir(notebook)
    {
        const notebookName = path.join('uploads', notebook);

        if (fs.existsSync(notebookName))
        {
            fs.rmSync(notebookName, { recursive: true });
            console.log(`Notebook directory "${notebookName}" deleted successfully.`);

            if (fs.existsSync('pdfs'))
                fs.rmSync('pdfs', { recursive: true });
        } else
        {
            console.log(`Notebook directory "${notebookName}" not found.`);
        }
    }

    async deleteNotebook(shelfName, notebookName)
    {
        try
        {
            await this.refreshAccessTokenIfNeeded();


            // Construct the path of the PDF file on Dropbox
            const pdfFilePath = `/${shelfName}/${notebookName}_notebook.pdf`;

            console.log(pdfFilePath);
            // Delete the PDF file from Dropbox
            const deleteResponse = await this.dbx.filesDeleteV2({
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

    async getNotebooks(shelfName)
    {
        try
        {
            await this.refreshAccessTokenIfNeeded();


            // Concatenate shelfName with a leading slash to form the folder path
            const folderPath = `/${shelfName}`;

            // Get the list of files and directories in the specified folder
            const listResponse = await this.dbx.filesListFolder({
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

    async getNotebookContent(shelfName, notebookName)
    {
        try
        {
            await this.refreshAccessTokenIfNeeded();

            // Construct the path of the PDF file on Dropbox
            const pdfFilePath = `/${shelfName}/${notebookName}_notebook.pdf`;

            // Get the PDF file content from Dropbox
            const response = await this.dbx.filesDownload({
                path: pdfFilePath,
            });

            console.log(response.result.fileBinary);
            return response;
        } catch (dropboxError)
        {
            console.error('Error fetching PDF file from Dropbox:', dropboxError);
            throw dropboxError;
        }
    }

    saveImagesToUploadDir(notebookName, files)
    {
        const uploadsDir = path.join('uploads', notebookName);
        if (!fs.existsSync(uploadsDir))
        {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        files.forEach((file) =>
        {
            const newPath = path.join(uploadsDir, file.filename);
            fs.renameSync(file.path, newPath);
        });
    }
}

module.exports = NotebookHelper;
