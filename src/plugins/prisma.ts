import Hapi from '@hapi/hapi';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client outside the plugin
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        prisma: PrismaClient;
    }
}

const prismaPlugin: Hapi.Plugin<null> = {
    name: 'prisma',
    register: async (server: Hapi.Server) => {
        // Assign the pre-initialized client
        server.app.prisma = prisma;
        
        console.log('Prisma client initialized');
        
        server.ext({
            type: 'onPostStop',
            method: async (server: Hapi.Server) => {
                await server.app.prisma.$disconnect();
                console.log('Prisma client disconnected');
            },
        });
    },
};

export default prismaPlugin;