import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendRegistrationCode(email: string, code: string) {
    await this.sendMail({
      from: this.sender(),
      to: email,
      subject: 'Your Rentra verification code',
      html: `
        <p>Hello,</p>
        <p>Enter this code in Rentra to verify your email and create your account:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:6px">${code}</p>
        <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      `,
    });
  }

  async sendLoginCode(email: string, code: string) {
    await this.sendMail({
      from: this.sender(),
      to: email,
      subject: 'Your Rentra sign-in code',
      html: `
        <p>Hello,</p>
        <p>Enter this code in Rentra to finish signing in:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:6px">${code}</p>
        <p>This code expires in 10 minutes. If you did not try to sign in, you can ignore this email.</p>
      `,
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.frontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

    await this.sendMail({
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

    await this.sendMail({
      from: this.sender(),
      to: email,
      subject: 'Reset your Rentra password',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Use the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
      `,
    });
  }

  private async sendMail(options: nodemailer.SendMailOptions) {
    try {
      await this.transporter().sendMail(options);
    } catch (error) {
      this.logger.error(
        'Email delivery failed',
        error instanceof Error ? error.message : undefined,
      );
      throw new ServiceUnavailableException(
        'Email delivery is unavailable. Check the configured email provider credentials and try again.',
      );
    }
  }

  private transporter() {
    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_PASSWORD?.replace(/\s/g, '');
    if (!user || !password) {
      throw new ServiceUnavailableException(
        'Email verification delivery is not configured',
      );
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: password },
      dnsTimeout: 2500,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
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
