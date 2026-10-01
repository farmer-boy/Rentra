import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'subssems336@gmail.com',
        pass: process.env.GMAIL_PASSWORD || '',
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `http://localhost:3000/api/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.GMAIL_USER || 'subssems336@gmail.com',
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
    const resetUrl = `http://localhost:3000/api/auth/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.GMAIL_USER || 'subssems336@gmail.com',
      to: email,
      subject: 'Reset your Rentra password',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Use the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
      `,
    });
  }
}
