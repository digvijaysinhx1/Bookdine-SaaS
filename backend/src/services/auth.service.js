import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (data) => {
  const { tenant_id, name, email, phone, role, password } = data;

  if (!tenant_id || !name || !email || !password || !role) {
    throw new Error("All fields are required");
  }

  // Check if email already exists
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1 AND tenant_id = $2",
    [email, tenant_id]
  );
  if (existing.rows.length > 0) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (tenant_id, name, email, phone, role, password)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role`,
    [tenant_id, name, email, phone, role, hashedPassword]
  );

  return result.rows[0];
};

export const login = async (data) => {
  const { email, password, tenant_id } = data;

  if (!email || !password || !tenant_id) {
    throw new Error("Email, password and tenant_id are required");
  }

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND tenant_id = $2",
    [email, tenant_id]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, tenant_id: user.tenant_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};