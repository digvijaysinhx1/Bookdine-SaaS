import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../db/index.js";

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = {
      id: data.user.id,
      tenant_id: data.user.user_metadata?.tenant_id,
      role: data.user.user_metadata?.role,
    };

    return next();
  }
};
