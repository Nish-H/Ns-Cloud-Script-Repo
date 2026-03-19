import { Octokit } from "@octokit/rest";

export async function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }
  return new Octokit({ auth: token });
}

export async function getRepoContents(path = "") {
  const octokit = await getOctokit();
  const { data } = await octokit.repos.getContent({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    path,
  });
  return data;
}

export async function getFileContent(path) {
  const octokit = await getOctokit();
  const { data } = await octokit.repos.getContent({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    path,
  });
  // If it's a file, data is an object with content property (base64 encoded)
  if (Array.isArray(data)) {
    throw new Error(`Path ${path} is a directory`);
  }
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function createOrUpdateFile(path, content, message, branch = "main") {
  const octokit = await getOctokit();
  let sha = null;
  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      ref: branch,
    });
    sha = data.sha;
  } catch (error) {
    // File doesn't exist, which is fine for creation
    if (error.status !== 404) {
      throw error;
    }
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    sha,
    branch,
  });
}
