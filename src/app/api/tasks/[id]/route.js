import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, checkRole } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    const session = await getSession(req);
    checkRole(session, ['ADMIN']);

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ message: 'Task successfully deleted' });
  } catch (error) {
    console.error('[DELETE TASK ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status });
  }
}
