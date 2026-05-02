require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");
  const hashedPassword = await bcrypt.hash("admin1234", 10);

  // 1. Upsert Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: { email: "admin@gmail.com", password: hashedPassword, role: "ADMIN" }
  });

  // 2. Upsert Project (Fixes the Unique Constraint error)
  const project = await prisma.project.upsert({
    where: { id: "your-test-uuid" },
    update: {},
    create: { id: "your-test-uuid", name: "Task Manager Frontend", adminId: admin.id }
  });

  // 3. Create tasks (one overdue, one normal)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const tasks = [
    { title: "Overdue API Fix", status: "To Do", priority: "HIGH", order: 1, projectId: project.id, dueDate: yesterday },
    { title: "Dashboard UI", status: "In Progress", priority: "MEDIUM", order: 2, projectId: project.id, dueDate: nextWeek },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log("Seed complete! 🌱 Login: admin@gmail.com / admin1234");
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());