const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { address, base64, htmlTemplate } = JSON.parse(event.body);

  if (!address || !base64 || !htmlTemplate) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  const safeAddress = address.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-]/g, "");
  const filename = `customers/${safeAddress}.html`;

  const html = "<!DOCTYPE html>\n" + htmlTemplate.replace(
    /const base64 = localStorage\.getItem\('workbook'\);/,
    `const base64 = \`${base64}\`;`
  );

  const octokit = new Octokit({ auth: process.env.GH_TOKEN });

  const owner = "jnthnlee19";
  const repo = "my-studio-lookbook";

  try {
    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: "heads/main" });
    const latestCommitSha = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
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
      body: JSON.stringify({ url: `https://myonlinelookbook.netlify.app/customers/${safeAddress}.html` })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: `GitHub error: ${error.message}`
    };
  }
};
