import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const session = await getSession(req);
    const resolvedParams = await params;
    const { id: taskId } = resolvedParams;

    const { approach } = await req.json();
    if (!approach || !approach.trim()) {
      return NextResponse.json({ error: 'Approach text is required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user already submitted a proposal
    const existingProposal = await prisma.proposal.findFirst({
      where: { taskId, userId: session.id }
    });

    if (!existingProposal) {
      await prisma.proposal.create({
        data: {
          taskId,
          userId: session.id,
          email: session.email,
          expertise: session.expertise || 'General',
          text: approach
        }
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'Staging' },
      include: {
        proposals: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('[PROPOSAL ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to submit proposal' }, { status });
  }
}
