'use strict'

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const customFormat = printf(({ level, message, label, timestamp}) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

let transport = new transports.File({ filename: 'comisarua.log' });
if (process.env.NODE_ENV !== 'production') {
    transport = new transports.Console();
}

const logger = createLogger({
    level: 'info',
    format: combine(
        label({ label: process.pid }),
        timestamp(),
        customFormat
    ),
    transports: [transport]
});

module.exports = logger;
