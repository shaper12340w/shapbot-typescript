import { Message } from "discord.js"
import * as mainData from "../../app"
import * as queueData from '../../modules/lavalink/manageQueue';

const main = mainData;
const queue = queueData;

export function executeCommand(message:Message):void {
    const prefix = "!";
    const allowedUsers = ["457797236458258433"];
    const allowedGuilds = ["1047500814584926209"];

    if (!message.content.startsWith(`${prefix}cv `)) return;
    if (!allowedUsers.includes(message.author.id) && !allowedGuilds.includes(String(message.guild?.id))) return;

    const code = message.content.replace(`${prefix}cv `, '');
    try {
        const result = eval(code);
        if (result == null || result == undefined) {
            message.reply("ERROR: Result is null or undefined");
        } else if (String(result).length < 1) {
            message.reply("ERROR: Result is empty");
        } else {
            message.reply(`\`\`\`js\n${result.toString().substring(0, 1992)}\`\`\``);
        }
    } catch (error:any) {
        message.reply(`\`\`\`js\nError: ${error.message} (${error.name})\n${error.stack?.split('\n')[1]}\`\`\``);
    }
}

export function getToday():string {
    const date:Date = new Date();
    const year:string = String(date.getFullYear());
    const month = ("0" + String(1 + date.getMonth())).slice(-2);
    const day = ("0" + String(date.getDate())).slice(-2);
    const time = ("0" + String(date.getMinutes())).slice(-2);

    return year + "-" + month + "-" + day + "-" + time;
};

export function secondsToTime(seconds: number): string {
    if (seconds <= 0) {
        return '00:00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = remainingSeconds.toString().padStart(2, '0');

    if (hours === 0) {
        return `${minutesStr}:${secondsStr}`;
    }

    const hoursStr = hours.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

