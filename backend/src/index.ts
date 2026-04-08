import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import eventTypeRoutes from './routes/event-type.routes.js';
import slotRoutes from './routes/slot.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import ownerRoutes from './routes/owner.routes.js';
import publicRoutes from './routes/public.routes.js';

const server = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// Global error handler
server.setErrorHandler((error, _request, reply) => {
  server.log.error(error);
  const err = error as any;
  if (err.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      message: err.message,
      details: err.validation,
    });
  }
  const statusCode = err.statusCode || 500;
  return reply.code(statusCode).send({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
  });
});

// Health check endpoint
server.get(
  '/health',
  {
    schema: {
      response: {
        200: Type.Object({
          status: Type.String(),
          timestamp: Type.String(),
        }),
      },
    },
  },
  async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
);

// Start server
const start = async () => {
  try {
    // Register plugins
    await server.register(cors, {
      origin: true, // Adjust in production
    });
    await server.register(helmet);
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    // Register routes
    await server.register(eventTypeRoutes, { prefix: '/api' });
    await server.register(slotRoutes, { prefix: '/api' });
    await server.register(bookingRoutes, { prefix: '/api' });
    await server.register(ownerRoutes, { prefix: '/api' });
    await server.register(publicRoutes, { prefix: '/api' });

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    await server.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();