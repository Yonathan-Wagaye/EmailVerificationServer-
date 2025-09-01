// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MailtrapClient } from "mailtrap";

// Ensure .env loads from this folder even if started elsewhere
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// CORS: set your frontend origin (React dev server by default)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Port (default 30001)
const PORT = Number(process.env.PORT || 30001);

// In-memory store: { [email]: { code, timestamp } }
const codes = Object.create(null);

// --- Mailtrap Email Sending API client ---
const MAILTRAP_TOKEN = (process.env.MAILTRAP_TOKEN || "").trim();
const FROM_EMAIL = (process.env.EMAIL_FROM || "").trim();

if (!MAILTRAP_TOKEN) {
  console.error("[CONFIG] MAILTRAP_TOKEN is missing in .env");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(FROM_EMAIL)) {
  console.error(
    "[CONFIG] EMAIL_FROM is invalid. Use a plain verified email, e.g. EMAIL_FROM=noreply@yourdomain.com"
  );
}

const mailtrap = new MailtrapClient({ token: MAILTRAP_TOKEN });

// Utility: 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Root/health
app.get("/", (_req, res) => {
  res
    .status(200)
    .send("✅ Email Verification Server is running on http://localhost:" + PORT);
});
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "EmailVerificationServer",
    port: PORT,
    time: new Date().toISOString(),
  });
});

// Send code
app.post("/send-code", async (req, res) => {
  const emailRaw = (req.body?.email || "").trim();
  const email = emailRaw.toLowerCase();

  if (!email) return res.status(400).json({ error: "Email is required" });
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!looksLikeEmail) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const code = generateCode();
  codes[email] = { code, timestamp: Date.now() };

  try {
    const response = await mailtrap.send({
      from: { name: "EasyEyes Support", email: FROM_EMAIL }, // must be on a Mailtrap verified sending domain
      to: [{ email }],
      subject: "🔐 Your EasyEyes Verification Code",
      text: `Your verification code is: ${code}\n\nThis code is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size:16px; color:#333;">
          <h2 style="color:#0b5cff;">Your Verification Code</h2>
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <div style="font-size:24px; font-weight:bold; margin:16px 0; color:#000;">
            ${code}
          </div>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <br/>
          <p>Thanks,<br/>EasyEyes Team</p>
        </div>
      `,
      category: "verification_code",
    });

    // Optional: log Mailtrap response id/status
    console.log("[Mailtrap] send response:", response);

    res.json({ message: "Verification code sent" });
  } catch (err) {
    // Mailtrap SDK returns detailed errors
    const msg =
      err?.message ||
      err?.response?.text ||
      err?.response ||
      "Mailtrap send error";
    console.error("Error sending email:", msg);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Verify code
app.post("/verify-code", (req, res) => {
  const emailRaw = (req.body?.email || "").trim();
  const email = emailRaw.toLowerCase();
  const code = String(req.body?.code || "").trim();

  const record = codes[email];
  const tenMinutes = 10 * 60 * 1000;

  if (
    record &&
    record.code === code &&
    Date.now() - record.timestamp < tenMinutes
  ) {
    delete codes[email]; // one-time use
    return res.json({ verified: true });
  }

  return res
    .status(400)
    .json({ verified: false, message: "Invalid or expired code" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
