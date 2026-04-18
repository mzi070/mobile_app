import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'alex@example.com' },
    update: {},
    create: {
      auth0Id: 'auth0|demo-user',
      email: 'alex@example.com',
      name: 'Alex Chen',
      preferences: {
        theme: 'system',
        focusMode: 'both',
        workHoursStart: '09:00',
        workHoursEnd: '17:00',
        wellnessGoals: ['reduce-stress', 'exercise', 'sleep-better'],
        notificationsEnabled: true,
      },
    },
  });

  // Create user progress
  await prisma.userProgress.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      points: 0,
      level: 1,
      streakDays: 0,
      achievements: [],
    },
  });

  // Create sample tasks
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: 'Review project proposal',
        description: 'Go through the Q2 project proposal and provide feedback',
        priority: 'high',
        status: 'todo',
        category: 'Work',
        dueDate: tomorrow,
      },
      {
        userId: user.id,
        title: 'Grocery shopping',
        description: 'Buy vegetables, fruits, and milk',
        priority: 'medium',
        status: 'todo',
        category: 'Personal',
        dueDate: now,
      },
      {
        userId: user.id,
        title: 'Morning meditation',
        description: '10 minutes guided breathing',
        priority: 'low',
        status: 'done',
        category: 'Wellness',
        completedAt: now,
      },
    ],
    skipDuplicates: true,
  });

  // Create sample events
  const meetingStart = new Date(now);
  meetingStart.setHours(14, 0, 0, 0);
  const meetingEnd = new Date(now);
  meetingEnd.setHours(15, 0, 0, 0);

  await prisma.calendarEvent.createMany({
    data: [
      {
        userId: user.id,
        title: 'Team standup',
        startTime: meetingStart,
        endTime: meetingEnd,
        location: 'Zoom',
        reminders: [15, 5],
      },
    ],
    skipDuplicates: true,
  });

  // Create sample habits
  await prisma.habit.createMany({
    data: [
      {
        userId: user.id,
        title: 'Drink 8 glasses of water',
        frequency: 'daily',
        targetCount: 8,
        color: '#3B82F6',
        icon: 'water',
      },
      {
        userId: user.id,
        title: 'Walk 10,000 steps',
        frequency: 'daily',
        targetCount: 1,
        color: '#10B981',
        icon: 'walk',
      },
      {
        userId: user.id,
        title: 'Read for 30 minutes',
        frequency: 'daily',
        targetCount: 1,
        color: '#8B5CF6',
        icon: 'book',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
