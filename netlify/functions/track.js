const https = require('https');

exports.handler = async function (event, context) {
    console.log("Function invoked with query:", event.queryStringParameters);

    try {
        const { reference_number } = event.queryStringParameters || {};
        const API_URL = process.env.SHIPSY_API_URL || 'https://app.shipsy.in/api/client/integration/consignment/track';
        const API_KEY = process.env.SHIPSY_API_KEY;

        if (!API_KEY) {
            console.error("CRITICAL: SHIPSY_API_KEY is missing in environment variables.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: Missing API Key' })
            };
        }

        if (!reference_number) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing reference_number parameter' })
            };
        }

        const url = `${API_URL}?reference_number=${encodeURIComponent(reference_number)}`;
        console.log(`Proxying to: ${API_URL}`);

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
                    console.log(`Upstream Response: ${res.statusCode}`);
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
                console.error("Upstream Request Error:", e);
                resolve({
                    statusCode: 502,
                    body: JSON.stringify({ error: `Upstream error: ${e.message}` })
                });
            });

            req.end();
        });
    } catch (err) {
        console.error("Unhandled Function Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Internal Server Error: ${err.message}` })
        };
    }
};
