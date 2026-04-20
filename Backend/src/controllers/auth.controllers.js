import { generateJWTToken_username } from "../utils/generateJWTToken.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendMail } from "../utils/SendMail.js";

dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

// ================= GOOGLE STRATEGY =================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      done(null, profile);
    }
  )
);

// ================= GOOGLE LOGIN =================
export const googleAuthHandler = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// ================= GOOGLE CALLBACK =================
export const googleAuthCallback = passport.authenticate("google", {
  failureRedirect: `${FRONTEND_URL}/login`,
  session: false,
});

// ================= HANDLE LOGIN SUCCESS =================
export const handleGoogleLoginCallback = asyncHandler(async (req, res) => {
  console.log("\n******** Inside handleGoogleLoginCallback ********");

  let user = await User.findOne({ email: req.user._json.email });

  if (user && (!user.username || !user.name)) {
      console.log("Fixing existing user with missing fields");
      const safeName = req.user._json.name || "User" + Math.floor(Math.random() * 10000);
      if (!user.username) {
        user.username = safeName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 10000);
      }
      if (!user.name) {
        user.name = safeName;
      }
      await user.save({ validateBeforeSave: false }); // Force save to fix
  }
  
  // If user does not exist, create new user
  if (!user) {
    console.log("Creating new User from Google login");

    const safeName = req.user._json.name || "User" + Math.floor(Math.random() * 10000);
    const generatedUsername = safeName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 10000);

    user = await User.create({
      username: generatedUsername,
      name: safeName,
      email: req.user._json.email,
      picture: req.user._json.picture,
    });
  }

  // Ensure user object is fully populated (e.g., if create returns partial or findOne missing fields)
  if (!user.username) {
    console.error("User object missing username:", user);
    // Fallback or error handling
    return res.status(400).json({ success: false, error: "auth_failed_username_missing" });
  }

  // Generate JWT
  const jwtToken = generateJWTToken_username(user);
  const expiryDate = new Date(Date.now() + 60 * 60 * 1000);

  res.cookie("accessToken", jwtToken, {
    ...authCookieOptions,
    expires: expiryDate,
  });

  // Redirect to frontend with username as query parameter
  return res.redirect(`${FRONTEND_URL}/auth/google/callback?username=${user.username}`);
});

// ================= LOGOUT =================
export const handleLogout = (req, res) => {
  console.log("\n******** Inside handleLogout ********");

  // clear cookie with same attributes so browser removes it reliably
  res.clearCookie("accessToken", authCookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User logged out successfully"));
};

// ================= EMAIL/PASSWORD SIGNUP =================
export const handleEmailSignup = asyncHandler(async (req, res) => {
  console.log("\n******** Inside handleEmailSignup ********");

  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "An account with this email already exists. Please login instead.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const safeName = email.split("@")[0];
  const generatedUsername = safeName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + Math.floor(Math.random() * 10000);

  const user = await User.create({
    username: generatedUsername,
    name: safeName,
    email,
    password: hashedPassword,
  });

  const jwtToken = generateJWTToken_username(user);
  const expiryDate = new Date(Date.now() + 60 * 60 * 1000);

  res.cookie("accessToken", jwtToken, {
    ...authCookieOptions,
    expires: expiryDate,
  });

  return res.status(201).json(new ApiResponse(201, { username: user.username, email: user.email, name: user.name }, "Account created successfully"));
});

// ================= EMAIL/PASSWORD LOGIN =================
export const handleEmailLogin = asyncHandler(async (req, res) => {
  console.log("\n******** Inside handleEmailLogin ********");

  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.password) {
    throw new ApiError(400, "This account uses Google login. Please sign in with Google.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const jwtToken = generateJWTToken_username(user);
  const expiryDate = new Date(Date.now() + 60 * 60 * 1000);

  res.cookie("accessToken", jwtToken, {
    ...authCookieOptions,
    expires: expiryDate,
  });

  return res.status(200).json(new ApiResponse(200, { username: user.username, email: user.email, name: user.name }, "Login successful"));
});

// ================= FORGOT PASSWORD =================
export const handleForgotPassword = asyncHandler(async (req, res) => {
  console.log("\n******** Inside handleForgotPassword ********");

  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address");
  }

  const user = await User.findOne({ email });

  // Always respond with success to prevent email enumeration
  if (!user || !user.password) {
    return res.status(200).json(new ApiResponse(200, null, "If an account exists with this email, a reset link has been sent."));
  }

  // Generate a secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

  const emailHtml = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #FAFAE0; border-radius: 12px; border: 1px solid #F0D060;">
      <h2 style="color: #C3110C; margin: 0 0 16px; font-size: 1.5rem;">Reset Your Password</h2>
      <p style="color: #333; font-size: 0.95rem; line-height: 1.6;">
        You requested a password reset for your SkillXchange account. Click the button below to set a new password:
      </p>
      <a href="${resetUrl}" style="display: inline-block; margin: 20px 0; padding: 14px 32px; background: #C3110C; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 0.9rem; letter-spacing: 0.5px;">
        Reset Password
      </a>
      <p style="color: #666; font-size: 0.85rem; line-height: 1.5;">
        This link will expire in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  const sent = await sendMail(email, "SkillXchange - Reset Your Password", emailHtml);

  if (!sent) {
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send reset email. Please try again later.");
  }

  return res.status(200).json(new ApiResponse(200, null, "If an account exists with this email, a reset link has been sent."));
});

// ================= RESET PASSWORD =================
export const handleResetPassword = asyncHandler(async (req, res) => {
  console.log("\n******** Inside handleResetPassword ********");

  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "New password is required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Reset link is invalid or has expired");
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, null, "Password has been reset successfully. You can now login."));
});
