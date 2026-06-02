import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    await getSession(req);
    const resolvedParams = await params;
    const { id: taskId } = resolvedParams;

    const { remarks } = await req.json();

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { remarks },
      include: {
        proposals: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('[SUBMIT WORK ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to submit work' }, { status });
  }
}
