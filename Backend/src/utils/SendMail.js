import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.APP_PASSWORD,
  },
});

const sendMail = async (to, subject, Message) => {
  if (!process.env.EMAIL_ID || !process.env.APP_PASSWORD) {
     console.error("Missing EMAIL_ID or APP_PASSWORD in .env file");
     return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_ID,
    to: [to],
    subject: subject,
    html: Message,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    return false;
  }
};

export { sendMail };
