import { createOrUpdateFile } from "../../lib/github";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (decoded.purpose !== "psrepo") {
    return res.status(401).json({ message: "Invalid token purpose" });
  }

  const { fileName, content } = req.body; // content expected as base64 string
  if (!fileName || !content) {
    return res.status(400).json({ message: "fileName and content (base64) are required" });
  }

  // Decode the base64 content to get the original file content
  const fileContent = Buffer.from(content, "base64").toString("utf-8");

  try {
    // We'll upload to the reports folder
    const filePath = `reports/${fileName}`;
    await createOrUpdateFile(
      filePath,
      fileContent,
      `Upload report ${fileName} via PowerShell client`,
      "main"
    );
    res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
