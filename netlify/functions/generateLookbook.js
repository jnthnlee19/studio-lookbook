const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const address = (body.address || "").trim();

    if (!address) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing address in request body" })
      };
    }

    const filename = `${address.replace(/\s+/g, "_")}.html`;
    const sourcePath = path.join(__dirname, "..", "..", "lookbook.html");
    const destPath = path.join(__dirname, "..", "..", "customers", filename);

    const html = fs.readFileSync(sourcePath, "utf8");
    fs.writeFileSync(destPath, html);

    return {
      statusCode: 200,
      body: JSON.stringify({ file: `/customers/${filename}` })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error", details: err.message })
    };
  }
};
