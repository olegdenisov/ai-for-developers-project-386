import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '../prisma/generated/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore — модуль pg не имеет деклараций типов для ESM
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { ownerRoutes } from './modules/owner/owner.routes.js';
import { eventTypeRoutes } from './modules/event-types/event-type.routes.js';
import { slotRoutes } from './modules/slots/slot.routes.js';
import { bookingRoutes } from './modules/bookings/booking.routes.js';
import { errorHandler } from './common/errors/errorHandler.js';

// Initialize Prisma with PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

// Create Fastify instance
const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
});

// Register plugins
await app.register(cors, {
  origin: process.env.WEB_URL || 'http://localhost:5173',
  credentials: true,
});

await app.register(swagger, {
  openapi: {
    info: {
      title: 'Calendar Booking API',
      description: 'API для системы бронирования звонков в календаре',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
});

// Раздача статических файлов фронтенда (в production: apps/web/dist)
const webDistPath = path.resolve(__dirname, '../web/dist');
await app.register(fastifyStatic, {
  root: webDistPath,
  wildcard: false,
});

// Register error handler
app.setErrorHandler(errorHandler);

// Health check endpoint
app.get('/health', async () => ({ 
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

// Register routes
await app.register(ownerRoutes, { prefix: '/owner' });
await app.register(eventTypeRoutes, { prefix: '/event-types' });
await app.register(slotRoutes, { prefix: '/slots' });
await app.register(bookingRoutes, { prefix: '/public' });

// 404 handler: API-маршруты → JSON ошибка, остальное → index.html (SPA routing)
const API_PREFIXES = ['/owner', '/event-types', '/slots', '/public', '/docs', '/health'];
app.setNotFoundHandler((request, reply) => {
  const isApiRoute = API_PREFIXES.some((prefix) => request.url.startsWith(prefix));
  if (!isApiRoute && request.method === 'GET') {
    return reply.sendFile('index.html');
  }
  reply.status(404).send({
    code: 'NOT_FOUND',
    message: `Route ${request.method} ${request.url} not found`,
  });
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    app.log.info(`Server listening on http://${host}:${port}`);
    
    // Log available routes in development
    if (process.env.NODE_ENV === 'development') {
      app.log.info('Available routes:');
      app.printRoutes();
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  app.log.info('SIGINT received, shutting down gracefully');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, shutting down gracefully');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
