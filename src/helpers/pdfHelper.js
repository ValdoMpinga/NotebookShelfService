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

        return new Promise((resolve, reject) =>
        {
            fs.readdir(userDir, (err, files) =>
            {
                if (err)
                {
                    return reject('Error reading user directory.');
                }

                if (files.length === 0)
                {
                    return reject('No images found for the user.');
                }

                // Create a PDF document
                const doc = new PDFDocument();
                const pdfPath = path.join('pdfs', `${username}_images.pdf`);
                const writeStream = fs.createWriteStream(pdfPath);

                // Create the "pdfs" directory if it doesn't exist
                if (!fs.existsSync('pdfs'))
                {
                    fs.mkdirSync('pdfs');
                }

                doc.pipe(writeStream);

                // Add each image to the PDF as a new page
                files.forEach((file, index) =>
                {
                    if (index > 0)
                    {
                        doc.addPage(); // Add a new page for each image except the first one
                    }

                    const imagePath = path.join(userDir, file);
                    doc.image(imagePath, {
                        fit: [500, 500],
                    });
                });

                // Finalize the PDF and close the write stream
                doc.end();
                writeStream.on('finish', () =>
                {
                    resolve(pdfPath); // Resolve with the generated PDF file path
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

}

module.exports = PdfHelper;
