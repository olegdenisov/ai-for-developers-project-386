import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const server = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// Register plugins
await server.register(cors, {
  origin: true, // Adjust in production
});
await server.register(helmet);
await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
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