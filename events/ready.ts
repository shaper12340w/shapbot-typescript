import {Event} from '../structures/Event'
import {client, startTime} from '../app';
import {getToday} from "../plugins/common/extras";
import {Logger} from "../plugins/common/logger";

export default new Event({
    name: "ready",
    async run() {
        Logger.info(`Start at ${getToday()}`)
        Logger.info(`Logged in as ${client.user?.tag}!`);
        client.user?.setActivity(">_<")
        const endTime = process.hrtime(startTime);
        const executionTimeInMs = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2);
        Logger.info(`Execution time: ${executionTimeInMs}ms`);
    }
})