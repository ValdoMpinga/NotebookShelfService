"use strict";

const { Dropbox } = require('dropbox');
const tokenManagerInstance = require('../token/tokenManager')
class ShelfHelper
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

    async createShelf(shelfName)
    {
        // Create a new shelf directory on Dropbox

        try
        {
            await this.refreshAccessTokenIfNeeded();

            const createResponse = await this.dbx.filesCreateFolderV2({
                path: shelfName,
            });

            console.log('Dropbox shelf created:', createResponse);
            return createResponse;
        } catch (dropboxError)
        {
            console.error('Error creating Dropbox shelf:', dropboxError);
            throw dropboxError;
        }
    }

    async getShelfs(folderPath = '')
    {
        try
        {
          
            await this.refreshAccessTokenIfNeeded();

            const listResponse = await this.dbx.filesListFolder({
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

    async updateShelf(oldShelfName, newShelfName)
    {
        // Update the shelfName to be in the format '/Masters/shelfName'

        try
        {
            await this.refreshAccessTokenIfNeeded();

            const moveResponse = await this.dbx.filesMoveV2({
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

    async deleteShelf(directoryPath)
    {
        try
        {
            // Delete the directory recursively and return the response

            await this.refreshAccessTokenIfNeeded();

            const deleteResponse = await this.dbx.filesDeleteV2({
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

    
}

module.exports = ShelfHelper;
