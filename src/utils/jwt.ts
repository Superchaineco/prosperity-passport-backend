import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ;

export function signJwt(payload: object, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
