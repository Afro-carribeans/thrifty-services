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

dotenv.config();

let server: Server;

const init = async () => {
    server = Hapi.server({
        port: process.env.PORT || 8080,
        host: '0.0.0.0',
        debug: false,
        routes: {
            log: { collect: true },
            cors: {
                origin: ['*'],
                credentials: false,
            },
        },
    });

    // Register plugins
    await server.register([
        require('@hapi/inert'), 
        prismaPlugin, healthcheck,         
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
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();