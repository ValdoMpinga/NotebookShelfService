const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Custom multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb)
    {
        const username = req.body.username;
        const userDir = path.join('uploads', username);

        // Create the directory if it doesn't exist
        if (!fs.existsSync(userDir))
        {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir);
    },
    filename: function (req, file, cb)
    {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
