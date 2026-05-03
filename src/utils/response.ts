import { Injectable } from '@nestjs/common';

export interface MetaData {
  page: number;
  limit: number;
  total: number;
}

export interface ResponseParams<T> {
  statusCode: number;
  message: string;
  success?: boolean;
  data?: T | null;
  meta?: MetaData;
}

@Injectable()
export class ResponseService {
  static formatResponse<T>({ statusCode, message, data, meta }: ResponseParams<T>) {
    return {
      message,
      success: statusCode >= 200 && statusCode < 300,
      meta: meta ?? null,
      data: data ?? null,
    };
  }
}
