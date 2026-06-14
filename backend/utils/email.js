const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.sendEmail = async ({
  to,
  subject,
  text,
  html,
  attachments = [],
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"BVM ERP" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Email sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      message: err.message,
    };
  }
};
