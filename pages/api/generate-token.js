import jwt from "jsonwebtoken";
import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Create a JWT token for PowerShell client, valid for 60 minutes
  const token = jwt.sign(
    { userId: session.user.email, purpose: "psrepo" },
    process.env.JWT_SECRET,
    { expiresIn: "60m" }
  );

  res.status(200).json({ token });
}
