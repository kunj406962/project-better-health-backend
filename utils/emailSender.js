const nodemailer = require('nodemailer');

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetToken - Password reset token
 * @returns {Promise<boolean>} - Success status
 */
const sendResetEmail = async (to, resetToken) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // For self-signed certificates in development
      }
    });

    // Reset URL (pointing to your password reset web page)
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/reset-password.html?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from:`${process.env.EMAIL_USER}`,
      to: to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🔒 Password Reset</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              You requested to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #777; font-size: 14px; line-height: 1.6;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all;">
              <code style="color: #333;">${resetUrl}</code>
            </div>
            
            <p style="color: #777; font-size: 14px; line-height: 1.6;">
              This link will expire in <strong>1 hour</strong>.<br>
              If you didn't request this password reset, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated message, please do not reply.<br>
              &copy; ${new Date().getFullYear()} Your App Name. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `Password Reset Request\n\nYou requested to reset your password. Use this link to reset:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Password reset email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};

/**
 * Test email configuration
 */
const testEmailConfig = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

module.exports = { sendResetEmail, testEmailConfig };