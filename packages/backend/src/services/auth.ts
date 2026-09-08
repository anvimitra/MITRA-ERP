import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'anvimitra-erp-dev-super-secret-key-2026';

export interface TokenPayload {
  userId: string;
  schoolId?: string | null;
  role: string;
  name: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

export function comparePassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}
