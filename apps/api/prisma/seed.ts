import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create predefined owner
  const owner = await prisma.owner.upsert({
    where: { email: 'owner@calendar.local' },
    update: {},
    create: {
      name: 'Calendar Owner',
      email: 'owner@calendar.local',
      isPredefined: true,
    },
  });

  console.log('Created owner:', owner);

  // Create sample event types
  const eventTypes = await Promise.all([
    prisma.eventType.upsert({
      where: { id: 'sample-consultation' },
      update: {},
      create: {
        id: 'sample-consultation',
        name: 'Консультация',
        description: 'Индивидуальная консультация по любым вопросам',
        durationMinutes: 30,
        ownerId: owner.id,
      },
    }),
    prisma.eventType.upsert({
      where: { id: 'sample-meeting' },
      update: {},
      create: {
        id: 'sample-meeting',
        name: 'Встреча',
        description: 'Деловая встреча для обсуждения проектов',
        durationMinutes: 60,
        ownerId: owner.id,
      },
    }),
    prisma.eventType.upsert({
      where: { id: 'sample-call' },
      update: {},
      create: {
        id: 'sample-call',
        name: 'Звонок',
        description: 'Короткий звонок для быстрого обсуждения',
        durationMinutes: 15,
        ownerId: owner.id,
      },
    }),
  ]);

  console.log('Created event types:', eventTypes);

  // Generate sample slots for the next 14 days
  const today = new Date();
  const slots = [];

  for (let day = 0; day < 14; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    date.setHours(0, 0, 0, 0);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Create slots from 9:00 to 17:00 with 30-min intervals
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(date);
        startTime.setHours(hour, minute, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        slots.push({
          startTime,
          endTime,
          isAvailable: true,
        });
      }
    }
  }

  // Create slots in database
  const createdSlots = await Promise.all(
    slots.map(slot =>
      prisma.slot.create({
        data: slot,
      })
    )
  );

  console.log(`Created ${createdSlots.length} slots`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
