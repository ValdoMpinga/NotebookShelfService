require('dotenv').config();
const axios = require('axios')

const authorize = () =>
{
    return `https://www.dropbox.com/oauth2/authorize?client_id=${process.env.DROPBOX_API_KEY}&redirect_uri=http://localhost:3000/dropbox/authorize/redirect&response_type=code&token_access_type=offline`;
}

const redirect = (code) =>
{
    let tokenUri = `https://api.dropbox.com/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${process.env.DROPBOX_REDIRECT_URI}`

    return axios({
        method: 'POST',
        headers: { Authorization: 'Basic ' + Buffer.from(`${process.env.DROPBOX_API_KEY}:${process.env.DROPBOX_APP_SECRET}`).toString('base64') },
        url: tokenUri
    }).then(res =>
    {
        console.log(res);
        return res
    }).catch(e =>
    {
        console.log(e);
        return e
    })
}

module.exports = { authorize, redirect }
