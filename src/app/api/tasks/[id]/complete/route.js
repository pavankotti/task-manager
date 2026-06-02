import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, checkRole } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const session = await getSession(req);
    checkRole(session, ['ADMIN']);

    const resolvedParams = await params;
    const { id: taskId } = resolvedParams;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'Completed' },
      include: {
        proposals: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('[COMPLETE TASK ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to complete task' }, { status });
  }
}
