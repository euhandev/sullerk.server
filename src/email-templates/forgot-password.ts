import { BrevoEmailParams } from '@/interface/brevo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplate {
  async resetPasswordEmail(email: string, name: string, otp: string) {
    const params: BrevoEmailParams = {
      sender: { email: 'contact.proconnect2@gmail.com', name: 'oaktree' },
      to: [{ email, name }],
      subject: 'oaktree - Reset Your Password',
      htmlContent: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; line-height: 1.6; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #FF7600; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
            </div>
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Dear ${name},</p> <!-- Optional: personalize -->
                
                <p style="font-size: 16px; margin-bottom: 30px;">We received a request to reset your password. Use the following One-Time Password (OTP) to proceed:</p>
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <span style="display: inline-block; background-color: #f4f7fa; color: #FF7600; padding: 12px 30px; border: 2px dashed #FF7600; text-decoration: none; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                        ${otp}
                    </span>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 20px;">If you did not request a password reset, please ignore this email or contact support if you have any concerns.</p>
                
                <p style="font-size: 16px; margin-bottom: 0;">Best regards,<br>Your Support Team</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d;">
                <p style="margin: 0 0 10px;">This is an automated message, please do not reply to this email.</p>
                <p style="margin: 0;">© 2025 oaktree. All rights reserved.</p> <!-- Updated year -->
            </div>
        </div>
    </body>
    </html>`,
    };
    return params;
  }

  async consultaionReqAdvisorNotFoundForLocationEmail(
    email: string,
    adminName: string,
    customerName: string,
    customerEmail: string,
  ) {
    const params: BrevoEmailParams = {
      sender: { email: 'contact.proconnect2@gmail.com', name: 'oaktree' },
      to: [{ email, name: adminName }],
      subject: 'oaktree - Advisor Not Found for Consultation Request',
      htmlContent: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Advisor Not Found</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; line-height: 1.6; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #FF7600; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Advisor Assignment Required</h1>
            </div>
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Dear ${adminName},</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">A new consultation request has been submitted, but no advisor was automatically found for this customer.</p>
                
                <div style="background-color: #f4f7fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 16px;"><strong>Customer Details:</strong></p>
                    <p style="margin: 10px 0 0; font-size: 16px;">Name: ${customerName}</p>
                    <p style="margin: 5px 0 0; font-size: 16px;">Email: ${customerEmail}</p>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 20px;">For this customer we didn't found any advisor. You have to do that manually.</p>
                
                <p style="font-size: 16px; margin-bottom: 0;">Best regards,<br>Oaktree System</p>
            </div>
        </div>
    </body>
    </html>`,
    };
    return params;
  }

  async shareUserPasswordEmail(email: string, name: string, password: string) {
    const params: BrevoEmailParams = {
      sender: { email: 'contact.proconnect2@gmail.com', name: 'oaktree' },
      to: [{ email, name }],
      subject: 'oaktree - Welcome to the Platform',
      htmlContent: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to oaktree</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; line-height: 1.6; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #FF7600; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Welcome to Oaktree</h1>
            </div>
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Dear ${name},</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">An account has been created for you on our platform. Here are your login credentials:</p>
                
                <div style="background-color: #f4f7fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 10px 0 0; font-size: 16px;"><strong>Temporary Password:</strong> ${password}</p>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 20px;">For security reasons, we recommend that you change your password immediately after logging in for the first time.</p>
                
                <p style="font-size: 16px; margin-bottom: 0;">Best regards,<br>Oaktree Team</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d;">
                <p style="margin: 0 0 10px;">This is an automated system notification.</p>
                <p style="margin: 0;">© 2025 oaktree. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`,
    };
    return params;
  }
}
