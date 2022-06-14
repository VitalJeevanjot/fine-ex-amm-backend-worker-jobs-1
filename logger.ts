import winston from 'winston';
const PostgresTransport = require('winston-postgres-transport');

import { setRequiredVariable } from './helpers';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// const postgresUrl = `postgres://${setRequiredVariable('USER_NAME')}:${setRequiredVariable('USER_PASSWORD')}@${setRequiredVariable('DB_URL')}:${setRequiredVariable('DB_PORT')}/${setRequiredVariable('DB_NAME')}`
const options: any = {
  level: 'info',
  name: 'Postgres',
  postgresOptions: {
    // Is called with (connection, query, params)
    debug: console.log,
  },
  postgresUrl: `postgres://${setRequiredVariable('USER_NAME')}:${setRequiredVariable('USER_PASSWORD')}@${setRequiredVariable('DB_URL')}:${setRequiredVariable('DB_PORT')}/${setRequiredVariable('DB_NAME')}`,
  tableName: setRequiredVariable('DB_TABLE_NAME_LOGS'),
};

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.simple(),
    winston.format.timestamp(),
    winston.format.printf(info => `<${Date.now()}> [${info.timestamp}] ${info.level.toUpperCase()} - ${info.message}`)
  ),
  transports: [
    new winston.transports.File({ filename: 'fine_ex_ltd_mmm.log' }),
    new winston.transports.Console(),
    new PostgresTransport(options),
  ]
});


export default logger;