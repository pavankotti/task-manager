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

  // 2. Upsert Project
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

  // Delete existing tasks in this project to prevent unique/duplicate key conflicts on repeated seeds
  await prisma.task.deleteMany({ where: { projectId: project.id } });

  const tasks = [
    { title: "Overdue API Fix", status: "Open Tasks", priority: "HIGH", order: 1, projectId: project.id, dueDate: yesterday },
    { title: "Dashboard UI", status: "Open Tasks", priority: "MEDIUM", order: 2, projectId: project.id, dueDate: nextWeek },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log("Seed complete! 🌱 Login: admin@gmail.com / admin1234");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
