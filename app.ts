import { getToday } from "./modules/common/extras";
import { config } from 'dotenv'; config();
import { exClient } from "./structures/Client";
import { EventEmitter } from "eventemitter3";
import * as fs from 'fs';

console.time("loginTimer")

export const client = new exClient();
export const emitter:EventEmitter<string | symbol, any> = new EventEmitter();

client.start()

process.on('uncaughtException', (err: Error) => {
    console.log(`\n-----------------${getToday()}-----------------`);
    console.log(`Caught exception: ${err.message}\nException name: ${err.name}\nstack: ${err.stack}`);
    fs.appendFile("error.txt", `\n-----------------${getToday()}-----------------\n${String(err.stack)}`, (error) => {
        if (error) throw error;
        console.log('\n');
    });
});

