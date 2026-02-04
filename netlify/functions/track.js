const https = require('https');

exports.handler = async function (event, context) {
    const { reference_number } = event.queryStringParameters;
    const API_URL = process.env.SHIPSY_API_URL || 'https://app.shipsy.in/api/client/integration/consignment/track';
    const API_KEY = process.env.SHIPSY_API_KEY;

    if (!reference_number) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing reference_number parameter' })
        };
    }

    const url = `${API_URL}?reference_number=${encodeURIComponent(reference_number)}`;

    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: {
                'api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: data
                });
            });
        });

        req.on('error', (e) => {
            resolve({
                statusCode: 500,
                body: JSON.stringify({ error: e.message })
            });
        });

        req.end();
    });
};
