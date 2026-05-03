/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class GMailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendEmail(options: { to: string; subject: string; html: string }) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to send email via Gmail');
    }
  }
}
