import { Event } from '../structures/Event'
import { client } from '../app';
import { getToday } from "../modules/common/extras";

export default new Event({
    name: "ready",
    async run() {
        console.log("\n------------------------------------"+getToday()+"------------------------------------")
        console.log(`Logged in as ${client.user?.tag}!`);
        client.user?.setActivity(">_<")
        console.timeEnd("loginTimer")

    }
})