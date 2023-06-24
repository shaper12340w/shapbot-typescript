import { Message } from "discord.js"
import * as mainData from "../../app"
import * as queueData from '../../modules/lavalink/manageQueue';

const main = mainData;
const queue = queueData;
const imp = (a:string) => import(a);

export function executeCommand(message:Message):void {
    const prefix = ";";
    const allowedUsers = ["457797236458258433"];
    const allowedGuilds = [''];

    if (!message.content.startsWith(`${prefix}ev `)) return;
    if (!allowedUsers.includes(message.author.id) && !allowedGuilds.includes(String(message.guild?.id))) return;

    const code = message.content.replace(`${prefix}ev `, '');
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

export function convertTimeToSeconds(timeString:string) {
    const timeRegex =  /(?:(\d{1,2})시간|시|h)? ?(?:(\d{1,2})(?:분|m)?)? ?(?:(\d{1,2})(?:초|s)?)?/;

    const match = timeString.match(timeRegex);

    if (!match) {
        throw new Error('Invalid time format');
    }

    const hours = parseInt(match[1] ?? '0');
    const minutes = parseInt(match[2] ?? '0');
    const seconds = parseInt(match[3] ?? '0');

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    console.log(totalSeconds)
    return totalSeconds;
}

export function hexToRgba(hex:string, alpha:number):string {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}