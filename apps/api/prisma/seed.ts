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

  // Генерируем слоты для каждого типа события с правильной длительностью
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 14);

  let totalSlots = 0;

  for (const eventType of eventTypes) {
    const slots = [];

    const currentDate = new Date(today);
    while (currentDate <= endDate) {
      // Пропускаем выходные
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += eventType.durationMinutes) {
            const startTime = new Date(currentDate);
            startTime.setHours(hour, minute, 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + eventType.durationMinutes);

            // Не создаём слот если он выходит за пределы рабочего дня (17:00)
            if (endTime.getHours() > 17 || (endTime.getHours() === 17 && endTime.getMinutes() > 0)) {
              break;
            }

            slots.push({
              startTime,
              endTime,
              isAvailable: true,
              eventTypeId: eventType.id,
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    await prisma.slot.createMany({ data: slots });
    totalSlots += slots.length;
    console.log(`Created ${slots.length} slots for event type "${eventType.name}" (${eventType.durationMinutes} min)`);
  }

  console.log(`Total: ${totalSlots} slots created`);

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
