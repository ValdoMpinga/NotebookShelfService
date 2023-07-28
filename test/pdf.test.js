// test/upload.test.js

const request = require('supertest');
const app = require('../'); // Assuming your Express app is in src/app.js

describe('Image Upload Endpoint', () =>
{
    test('should upload an image successfully', async () =>
    {
        const response = await request(app)
            .post('/api/upload')
            .attach('image', './assets/images/lion.jpg'); // Replace 'path/to/your/image.jpg' with the actual path to the image file you want to upload

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Image uploaded successfully');
        // Add more assertions as per your API response, e.g., response.body.url should have the image URL if your API returns it after upload.
    });

    test('should return an error for invalid image format', async () =>
    {
        const response = await request(app)
            .post('/api/upload')
            .attach('image', './assets/images/lion.jpg'); // Replace 'path/to/your/non-image-file.txt' with the path to a non-image file

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Invalid image format');
        // Add more assertions as per your API response for error cases.
    });
});
