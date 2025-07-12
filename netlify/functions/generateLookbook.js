const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let address, base64, htmlTemplate;

  try {
    const body = JSON.parse(event.body);
    address = body.address;
    base64 = body.base64;
    htmlTemplate = body.htmlTemplate;
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  if (!address || !base64 || !htmlTemplate) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const safeAddress = address.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-]/g, "");
  const filename = `customers/${safeAddress}.html`;

  const html = "<!DOCTYPE html>\n" + htmlTemplate.replace(
    /const base64 = localStorage\.getItem\('workbook'\);/,
    `const base64 = \`${base64}\`;`
  );

  const octokit = new Octokit({ auth: process.env.GH_TOKEN });

  const owner = "jnthnlee19"; // or your GitHub username
  const repo = "studio-lookbook"; // corrected repo name

  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: "heads/main"
    });

    const latestCommitSha = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha
    });

    const baseTree = commitData.tree.sha;

    const { data: blobData } = await octokit.git.createBlob({
      owner,
      repo,
      content: html,
      encoding: "utf-8"
    });

    const { data: treeData } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTree,
      tree: [
        {
          path: filename,
          mode: "100644",
          type: "blob",
          sha: blobData.sha
        }
      ]
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: `Add lookbook page for ${address}`,
      tree: treeData.sha,
      parents: [latestCommitSha]
    });

    await octokit.git.updateRef({
      owner,
      repo,
      ref: "heads/main",
      sha: newCommit.sha
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: `https://studiolookbook.netlify.app/customers/${safeAddress}.html`
      })
    };

  } catch (error) {
    console.error("GitHub write error:", error); // ✅ helpful for debugging
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `GitHub error: ${error.message || "Unknown error"}`
      })
    };
  }
};
