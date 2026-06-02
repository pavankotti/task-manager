import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req) {
  try {
    await getSession(req);
    const { tasks } = await req.json();

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 });
    }

    // Perform transaction to ensure atomic updates of orders/statuses
    const updates = tasks.map(t =>
      prisma.task.update({
        where: { id: t.id },
        data: { status: t.status, order: t.order }
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ message: 'Successfully reordered tasks' });
  } catch (error) {
    console.error('[REORDER TASK ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to reorder tasks' }, { status });
  }
}
