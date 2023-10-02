require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const tokenManagerInstance = require("./src/token/tokenManager");
const os = require('os'); // Import the os module

// routes
const shelfRouter = require('./src/routes/shelfRoutes');
const notebookRouter = require('./src/routes/notebooksRoutes');
const pingRouter = require('./src/routes/pingRoute');
const dropboxAuthRouter = require('./src/routes/dropboxAuthRoute');

const app = express();

const cors = require('cors')

app.use(cors())

app.use(bodyParser.json());

app.listen(process.env.PORT, () =>
{
    tokenRefreshAndStartInterval();

    // Get the machine's IP address
    const machineIPAddress = getMachineIPAddress();
    console.log(`Server is listening on port ${process.env.PORT}`);
    console.log(`Machine IP address: ${machineIPAddress}`);
});

function tokenRefreshAndStartInterval()
{
    tokenManagerInstance.refreshAccessToken(process.env.DROPBOX_REFRESH_TOKEN)
        .then(() =>
        {
            // Schedule token refresh every 3 hours and 45 minutes (in milliseconds)
            const refreshInterval = 3 * 60 * 60 * 1000 + 45 * 60 * 1000;
            setInterval(() =>
            {
                tokenManagerInstance.refreshAccessToken(process.env.DROPBOX_REFRESH_TOKEN)
                    .then(() =>
                    {
                        console.log("Token refreshed on schedule.");
                    })
                    .catch(error =>
                    {
                        console.error("Error refreshing access token:", error);
                    });
            }, refreshInterval);
        })
        .catch(error =>
        {
            console.error("Error refreshing access token initially:", error);
        });
}

app.use('/shelf', shelfRouter);
app.use('/notebook', notebookRouter);
app.use('/ping', pingRouter);
app.use('/dropbox', dropboxAuthRouter);

// Function to get the machine's IP address
function getMachineIPAddress()
{
    const interfaces = os.networkInterfaces();
    let ipAddress = 'Unknown';

    for (const key in interfaces)
    {
        const iface = interfaces[key].find(iface => iface.family === 'IPv4' && !iface.internal);
        if (iface)
        {
            ipAddress = iface.address;
            break;
        }
    }

    return ipAddress;
}
