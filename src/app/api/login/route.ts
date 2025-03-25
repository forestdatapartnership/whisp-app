import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import pool from "@/lib/db";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/utils/compose";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

export const POST = compose(
  withLogging,
  withErrorHandling,
  withRequiredJsonBody
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
  const [log, body] = args;

  const { email, password } = body;

  if (email && password) {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT email FROM login_user($1, $2)", [email, password]);
      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const user = result.rows[0];

      const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "7d" });

      const response = NextResponse.json({ message: "Login successful" });
      response.headers.set(
        "Set-Cookie",
        serialize("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        })
      );
      return response;
    } catch (error) {
      console.error(error)
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
});
