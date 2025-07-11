const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  const { address, htmlContent } = JSON.parse(event.body);

  if (!address || !htmlContent) {
    return {
      statusCode: 400,
      body: 'Missing address or html content',
    };
  }

  try {
    const safeAddress = address.replace(/[^a-zA-Z0-9]/g, '');
    const filePath = path.join(__dirname, `../../customers/${safeAddress}.html`);
    fs.writeFileSync(filePath, htmlContent);

    return {
      statusCode: 200,
      body: `Page created: ${safeAddress}.html`,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Error creating file: ${err.message}`,
    };
  }
};
