const fs = require('fs');
const path = require('path');

function deleteUserDirectory(username)
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

module.exports = deleteUserDirectory;
