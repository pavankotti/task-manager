import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, checkRole } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = await getSession(req);
    checkRole(session, ['ADMIN']);

    const { title, priority, projectId, dueDate } = await req.json();

    if (!title || !title.trim() || !projectId) {
      return NextResponse.json({ error: 'Title and projectId are required' }, { status: 400 });
    }

    // Find the current maximum order for tasks in 'Open Tasks' status in this project
    const maxTask = await prisma.task.findFirst({
      where: { projectId, status: 'Open Tasks' },
      orderBy: { order: 'desc' }
    });

    const nextOrder = maxTask ? maxTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title,
        status: 'Open Tasks',
        priority,
        projectId,
        order: nextOrder,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        proposals: true
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[CREATE TASK ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status });
  }
}
