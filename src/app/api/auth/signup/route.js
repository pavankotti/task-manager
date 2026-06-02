import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export async function POST(req) {
  try {
    const { email, password, role, expertise } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'MEMBER',
        expertise: expertise || 'General',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, expertise: user.expertise },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, expertise: user.expertise }
    }, { status: 201 });
  } catch (error) {
    console.error('[SIGNUP ERROR]', error);
    return NextResponse.json({ error: 'Internal server error during signup' }, { status: 500 });
  }
}
