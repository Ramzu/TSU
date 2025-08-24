import nodemailer from 'nodemailer';
import { storage } from './storage';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  async initializeTransporter() {
    const smtpConfig = await storage.getSmtpConfig();
    
    if (!smtpConfig) {
      throw new Error('SMTP configuration not found. Please configure SMTP settings in admin panel.');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    });

    // Verify the connection
    await this.transporter.verify();
    
    return this.transporter;
  }

  async sendPasswordResetEmail(toEmail: string, resetToken: string, userName?: string) {
    if (!this.transporter) {
      await this.initializeTransporter();
    }
    
    if (!this.transporter) {
      throw new Error('Failed to initialize email transporter');
    }

    const smtpConfig = await storage.getSmtpConfig();
    if (!smtpConfig) {
      throw new Error('SMTP configuration not found');
    }

    const resetUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: toEmail,
      subject: 'Reset Your TSU Wallet Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5016 0%, #3a6b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #d4af37; margin: 0; font-size: 28px;">TSU Wallet</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Trade Settlement Unit</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2d5016; margin-top: 0;">Password Reset Request</h2>
            
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            
            <p>We received a request to reset your password for your TSU Wallet account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #d4af37; color: #2d5016; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              If you're having trouble clicking the "Reset Password" button, copy and paste the URL above into your web browser.
            </p>
            
            <p style="font-size: 14px; color: #666;">
              This email was sent from TSU Wallet. If you have any questions, please contact our support team.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        TSU Wallet - Password Reset Request
        
        Hello${userName ? ` ${userName}` : ''},
        
        We received a request to reset your password for your TSU Wallet account. If you didn't make this request, you can safely ignore this email.
        
        To reset your password, visit this link:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you're having trouble with the link, copy and paste it into your web browser.
        
        This email was sent from TSU Wallet. If you have any questions, please contact our support team.
      `
    };

    const result = await this.transporter!.sendMail(mailOptions);
    return result;
  }

  async testConnection() {
    try {
      const transporter = await this.initializeTransporter();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const emailService = new EmailService();