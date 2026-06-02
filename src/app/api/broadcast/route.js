import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    await getSession(req);
    
    const latest = await prisma.task.findFirst({
      where: { status: 'Completed', assigneeId: { not: null } },
      include: {
        assignee: { select: { email: true, expertise: true } },
        project: { select: { name: true } },
      },
      // Keep alignment with original ordering. If standard uuid, order: 'desc' serves as a placeholder fallback.
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(latest || {});
  } catch (error) {
    console.error('[BROADCAST FETCH ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch broadcast data' }, { status });
  }
}
