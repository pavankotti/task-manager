import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    await getSession(req);
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, expertise: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('[FETCH USERS ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status });
  }
}
