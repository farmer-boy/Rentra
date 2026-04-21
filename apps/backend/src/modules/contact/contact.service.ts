import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'subssems336@gmail.com',
        pass: process.env.GMAIL_PASSWORD || '', // Use app-specific password
      },
    });
  }

  async createMessage(dto: CreateContactMessageDto) {
    try {
      // Validate input
      if (!dto.name || !dto.email || !dto.phone || !dto.message) {
        throw new BadRequestException('All fields are required');
      }

      // Save to database
      const message = await this.prisma.contactMessage.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          message: dto.message,
          status: 'new',
          read: false,
        },
      });

      // Send email to admin
      try {
        await this.sendEmailToAdmin(message);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails
      }

      return {
        success: true,
        message: 'Message received! We will get back to you soon.',
        data: message,
      };
    } catch (error) {
      console.error('Contact form error:', error);
      throw new BadRequestException(
        error.message || 'Failed to process contact message'
      );
    }
  }

  private async sendEmailToAdmin(message: any) {
    const adminEmail = process.env.ADMIN_EMAIL || 'subssems336@gmail.com';

    const mailOptions = {
      from: process.env.GMAIL_USER || 'subssems336@gmail.com',
      to: adminEmail,
      subject: `New Contact Form Message from ${message.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e; margin-bottom: 20px;">📬 New Contact Message from Rentra</h2>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #22c55e; margin-bottom: 20px;">
              <p><strong>Name:</strong> ${message.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${message.email}">${message.email}</a></p>
              <p><strong>Phone:</strong> <a href="tel:${message.phone}">${message.phone}</a></p>
            </div>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Message:</h3>
              <p style="color: #555; line-height: 1.6;">${message.message.replace(/\n/g, '<br>')}</p>
            </div>

            <div style="border-top: 1px solid #ddd; padding-top: 15px; color: #999; font-size: 12px;">
              <p>Message ID: ${message.id}</p>
              <p>Received at: ${new Date(message.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Karachi',
              })}</p>
              <p><strong>Action:</strong> <a href="http://localhost:3000/admin/messages" style="color: #22c55e; text-decoration: none;">View all messages</a></p>
            </div>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async getAllMessages(filters?: { status?: string; read?: boolean }) {
    return this.prisma.contactMessage.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.read !== undefined && { read: filters.read }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMessageById(id: string) {
    return this.prisma.contactMessage.findUnique({
      where: { id },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }

  async deleteMessage(id: string) {
    return this.prisma.contactMessage.delete({
      where: { id },
    });
  }
}
