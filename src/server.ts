'use strict';

import Hapi, { Server } from '@hapi/hapi';
import * as dotenv from 'dotenv';
import prismaPlugin from './plugins/prisma';
import healthcheck from './plugins/healthcheck';
import UserRoutePlugin from './plugins/userRoutePlugin';
import CooperativeRoutePlugin from './plugins/cooperativeRoutePlugin';
import ContributionRoutePlugin from './plugins/contributionRoutePlugin';
import LoanRoutePlugin from './plugins/loanRoutePlugin';
import PaymentRoutePlugin from './plugins/paymentRoutePlugin';
import RepaymentRoutePlugin from './plugins/repaymentRoutePlugin';
import ReferralRoutePlugin from './plugins/referralRoutePlugin';
import ProfitShareRoutePlugin from './plugins/profitShareRoutePlugin';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env');
}

let server: Server;

const init = async () => {
    try {
        server = Hapi.server({
            port: process.env.PORT || 50000,
            host: '0.0.0.0',
            debug: false,
            routes: {
                log: { collect: true },
                cors: {
                    origin: ['*'],
                    credentials: false,
                    additionalHeaders: ['cache-control', 'x-requested-with']
                },
            }
        });

        console.log('Registering plugins...');
        await server.register([
            require('@hapi/inert'), 
            prismaPlugin, 
            healthcheck,         
            // Route plugins
            UserRoutePlugin,
            CooperativeRoutePlugin,
            ContributionRoutePlugin,
            LoanRoutePlugin,
            PaymentRoutePlugin,
            RepaymentRoutePlugin,
            ReferralRoutePlugin,
            ProfitShareRoutePlugin
        ]);
        console.log('All plugins registered successfully');

        // Test database connection
        try {
            await server.app.prisma.$queryRaw`SELECT 1`;
            console.log('Database connection successful');
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }

        // Health check endpoint
        server.route({
            method: 'GET',
            path: '/ping',
            handler: () => {
                return { status: 'ok', timestamp: new Date().toISOString() };
            }
        });

        // Static file serving fallback
        server.route({
            method: 'GET',
            path: '/{param*}',
            handler: {
                directory: {
                    path: '.',
                    redirectToSlash: true,
                    index: true,
                },
            },
        });

        await server.start();
        console.log('Server running on %s', server.info.uri);
        console.log('Available routes:');
        server.table().forEach(route => {
            console.log(`${route.method}\t${route.path}`);
        });

    } catch (error) {
        console.error('Server initialization failed:', error);
        process.exit(1);
    }
};

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

// Start the server
init();