import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, checkRole } from '@/lib/auth';

export async function GET(req) {
  try {
    await getSession(req);
    const projects = await prisma.project.findMany({
      include: { _count: { select: { tasks: true } } },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('[FETCH PROJECTS ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status });
  }
}

export async function POST(req) {
  try {
    const session = await getSession(req);
    checkRole(session, ['ADMIN']);

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: { name, adminId: session.id },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('[CREATE PROJECT ERROR]', error);
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status });
  }
}
