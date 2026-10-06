import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    _error: unknown,
    user: TUser | null,
    info: unknown,
    context: ExecutionContext,
  ): TUser | null {
    void info;
    void context;
    return user;
  }
}
