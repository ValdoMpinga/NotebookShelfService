require('dotenv').config();
const axios = require('axios')

var accessToken = '';

function setAccessToken(token) 
{
    accessToken = token;
}

function getAccessToken()
{
    return accessToken;
}

async function refreshAccessToken(refreshToken)
{
    const tokenEndpoint = 'https://api.dropbox.com/oauth2/token';

    const data = new URLSearchParams();
    data.append('grant_type', 'refresh_token');
    data.append('refresh_token', refreshToken);
    data.append('client_id', process.env.DROPBOX_API_KEY);
    data.append('client_secret', process.env.DROPBOX_APP_SECRET);

    try
    {
        const response = await axios.post(tokenEndpoint, data);
        let newAccessToken = response.data.access_token;
        setAccessToken(newAccessToken); 
    } catch (error)
    {
        console.error('Error refreshing access token:', error);
        throw error;
    }
};


module.exports = { setAccessToken, getAccessToken, refreshAccessToken }
