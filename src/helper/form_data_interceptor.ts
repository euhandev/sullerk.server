import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class ParseFormDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();

    if (request.body && request.body.data) {
      try {
        const parsedData = JSON.parse(request.body.data); // Parse the 'data' field
        request.body = { ...request.body, ...parsedData }; // Attach the parsed data to the body
      } catch (error) {
        console.log(error.message);
        throw new Error('Invalid JSON format in data field');
      }
    }

    return next.handle();
  }
}
