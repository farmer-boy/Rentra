import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.frontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

    await this.transporter().sendMail({
      from: this.sender(),
      to: email,
      subject: 'Verify your Rentra account',
      html: `
        <p>Hello,</p>
        <p>Thank you for joining Rentra. Please verify your email address:</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.frontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

    await this.transporter().sendMail({
      to: email,
      subject: 'Reset your Rentra password',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Use the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
      `,
    });
  }

  private transporter() {
    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_PASSWORD;
    if (!user || !password) {
      throw new ServiceUnavailableException(
        'Email verification delivery is not configured',
      );
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: password },
    });
  }

  private sender() {
    const user = process.env.GMAIL_USER;
    if (!user) {
      throw new ServiceUnavailableException(
        'Email verification delivery is not configured',
      );
    }
    return user;
  }

  private frontendBaseUrl() {
    const baseUrl =
      process.env.FRONTEND_URL ??
      (process.env.NODE_ENV === 'production'
        ? undefined
        : 'http://localhost:5173');
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      throw new ServiceUnavailableException(
        'FRONTEND_URL must be configured for authentication emails',
      );
    }
    return baseUrl.replace(/\/+$/, '');
  }
}
