import jwt from 'jsonwebtoken';

export const signToken = (payload: any, secret: string, options?: any): string => {
  return jwt.sign(payload, secret, options);
}; 