import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export async function getSession(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload; // Returns { id, email, role, expertise }
  } catch (err) {
    throw new Error('Forbidden: Invalid or expired token');
  }
}

export function checkRole(session, allowedRoles) {
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}
