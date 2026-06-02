import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, checkRole } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const session = await getSession(req);
    checkRole(session, ['ADMIN']);

    const resolvedParams = await params;
    const { id: taskId } = resolvedParams;

    // Remove all proposals and reset task fields atomically
    await prisma.$transaction([
      prisma.proposal.deleteMany({ where: { taskId } }),
      prisma.task.update({
        where: { id: taskId },
        data: {
          assigneeId: null,
          status: 'Open Tasks',
          winningApproach: null,
          remarks: null
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
    console.error('[REJECT PROPOSALS ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to reject proposals' }, { status });
  }
}
