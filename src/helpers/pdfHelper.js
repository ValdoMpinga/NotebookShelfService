const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

class PdfHelper
{
    saveImagesToUserDir(username, files)
    {
        const userDir = path.join('uploads', username);
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


    async convertToPDF(username)
    {
        const userDir = path.join('uploads', username);
        const pdfPath = path.join('pdfs', `${username}_images.pdf`);

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
                writeStream.on('finish', () =>
                {
                    console.log('PDF successfully written to file:', pdfPath);
                    resolve(pdfPath); // Resolve with the generated PDF file path
                });

                writeStream.on('error', (err) =>
                {
                    console.error('Error writing PDF to file:', err);
                    reject('Error writing PDF to file.');
                });
            });
        });
    }


    deleteUserDirectory(username)
    {
        const userDir = path.join('uploads', username);

        if (fs.existsSync(userDir))
        {
            fs.rmdirSync(userDir, { recursive: true });
            console.log(`User directory "${userDir}" deleted successfully.`);
        } else
        {
            console.log(`User directory "${userDir}" not found.`);
        }
    }

    async addImagesToPDF(username)
    {
        const userDir = path.join('uploads', username);
        const pdfPath = path.join('pdfs', `${username}_images.pdf`);

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

                const existingPDFStream = fs.createReadStream(pdfPath);

                // Create a new PDF document
                const doc = new PDFDocument();
                const tempPdfPath = path.join('pdfs', `${username}_temp.pdf`);
                const writeStream = fs.createWriteStream(tempPdfPath);

                doc.pipe(writeStream);

                // Read the existing PDF and add its pages to the new PDF
                existingPDFStream.pipe(doc);

                // Add each new image to the PDF as a new page
                for (const file of files)
                {
                    doc.addPage(); // Add a new page for each image
                    const imagePath = path.join(userDir, file);
                    doc.image(imagePath, {
                        fit: [500, 500],
                    });
                }

                // Finalize the new PDF and close the write stream
                doc.end();
                writeStream.on('finish', () =>
                {
                    // Replace the existing PDF with the new one
                    fs.renameSync(tempPdfPath, pdfPath);

                    // Delete the user directory after adding pages to the PDF
                    this.deleteUserDirectory(username);

                    resolve(pdfPath); // Resolve with the updated PDF file path
                });
            });
        });
    }

}

module.exports = PdfHelper;

