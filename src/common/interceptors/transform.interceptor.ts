import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        // If data is already in success format, return it as is (useful for paginated metadata)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return {
          success: true,
          statusCode: response.statusCode,
          data: data === undefined ? null : data,
        };
      }),
    );
  }
}
