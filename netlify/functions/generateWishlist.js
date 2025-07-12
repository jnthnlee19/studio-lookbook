const { Octokit } = require("@octokit/rest");

exports.handler = async function (event, context) {
  try {
    const { address, htmlTemplate } = JSON.parse(event.body || '{}');

    if (!address || !htmlTemplate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing address or htmlTemplate" }),
      };
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const repo = "studio-lookbook"; // ✅ Make sure this is correct
    const owner = "jnthnlee19"; // 🔁 Replace with your GitHub username
    const path = `customers/${address}/index.html`;

    // Check if file already exists (optional)
    let sha = null;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      sha = data.sha;
    } catch (err) {
      // If not found, that's fine (we're creating it)
      if (err.status !== 404) throw err;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Add wishlist page for ${address}`,
      content: Buffer.from(htmlTemplate).toString("base64"),
      sha: sha || undefined,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: `https://studiolookbook.netlify.app/customers/${address}/index.html`,
      }),
    };
  } catch (error) {
    console.error("Error generating wishlist:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Unknown error" }),
    };
  }
};
