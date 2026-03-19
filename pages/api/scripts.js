import { getOctokit, getRepoContents, getFileContent } from "../../lib/github";

export default async function handler(req, res) {
  const { method } = req;

  // We'll check for a simple JWT token in the Authorization header for now.
  // In a real app, you'd verify the JWT properly.
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  // Verify the JWT token (same secret as used in generate-token)
  const jwt = require("jsonwebtoken");
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // Optional: Check that the token is for the psrepo purpose
  if (decoded.purpose !== "psrepo") {
    return res.status(401).json({ message: "Invalid token purpose" });
  }

  if (method === "GET") {
    // Check if we are requesting a specific script
    const { script } = req.query;
    if (script) {
      try {
        const filePath = `scripts/${script}`;
        const { content } = await getFileContent(filePath);
        return res.status(200).json({ content });
      } catch (error) {
        if (error.status === 404) {
          return res.status(404).json({ message: "Script not found" });
        }
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }
    } else {
      // List all scripts in the scripts folder
      try {
        const contents = await getRepoContents("scripts");
        // Filter only files (not directories) and map to names
        const scripts = contents
          .filter((file) => file.type === "file")
          .map((file) => file.name);
        return res.status(200).json({ scripts });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
