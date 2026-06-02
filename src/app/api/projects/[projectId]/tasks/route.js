import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    await getSession(req);
    const resolvedParams = await params;
    const { projectId } = resolvedParams;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        proposals: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { order: 'asc' },
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[FETCH TASKS ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch tasks' }, { status });
  }
}
