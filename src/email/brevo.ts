import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BrevoEmailParams } from '@/interface/brevo';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class BrevoService {
  private readonly brevoApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.brevoApiKey = this.configService.get('BREVO_API_KEY');
  }

  async sendEmail(params: BrevoEmailParams): Promise<any> {
    const endpoint = 'https://api.brevo.com/v3/smtp/email';

    const payload: any = {
      sender: params.sender,
      to: params.to,
      subject: params.subject,
      htmlContent: params.htmlContent,
    };

    if (params.cc) payload.cc = params.cc;
    if (params.bcc) payload.bcc = params.bcc;
    if (params.textContent) payload.textContent = params.textContent;
    if (params.attachmentUrls) payload.attachmentUrls = params.attachmentUrls;
    if (params.headers) payload.headers = params.headers;
    if (params.replyTo) payload.replyTo = params.replyTo;

    try {
      const response = await this.httpService.axiosRef.post(endpoint, payload, {
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        const message = data.message || `Brevo API error (status ${status})`;
        throw new HttpException({ status, message, response: data }, status);
      }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
