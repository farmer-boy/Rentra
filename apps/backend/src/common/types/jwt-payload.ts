export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  role?: string;
  iat?: number;
  exp?: number;
}
