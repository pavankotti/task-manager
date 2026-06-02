import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, checkRole } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const session = await getSession(req);
    checkRole(session, ['ADMIN']);

    const resolvedParams = await params;
    const { id: taskId } = resolvedParams;

    const { userId, approachText } = await req.json();

    if (!userId || !approachText) {
      return NextResponse.json({ error: 'userId and approachText are required' }, { status: 400 });
    }

    // Atomically assign the task and clear proposal pool
    await prisma.$transaction([
      prisma.proposal.deleteMany({ where: { taskId } }),
      prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'Assigned',
          assigneeId: userId,
          winningApproach: approachText
        }
      })
    ]);

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        proposals: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('[ASSIGN TASK ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to assign task' }, { status });
  }
}
