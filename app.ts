import { config } from 'dotenv'; config();
import { exClient } from "./structures/Client";
import { EventEmitter } from "eventemitter3";
import { Logger } from "./plugins/common/logger";

export const startTime = process.hrtime();
export const client = new exClient();
export const emitter:EventEmitter<string | symbol, any> = new EventEmitter();

client.start().then()

process.on('uncaughtException', (err: Error) => {
    Logger.error(String(err.stack));
});

