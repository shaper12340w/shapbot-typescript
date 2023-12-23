import { Message, TextChannel } from 'discord.js'
import { client } from '../app';
import { Event } from '../structures/Event'
import { executeCommand } from '../plugins/common/extras';
import {CommandData} from "../structures/Client";
import {ServerProperty} from "../structures/Property";


const prefix = async (id:string) =>(await ServerProperty.get(id))!!.prefix;

const duplicatedCommand:({[p:string]:string[]} | undefined)[] = client.messageCommands.map((command:CommandData["message"]) => {
    if(command)
    return { [String(command.data.name)]: command.data.duplicatedData ? command.data.duplicatedData : <string[]>[] }
})

export default new Event({
    name: "messageCreate",
    async run(message: Message) {
        const channel = message.channel as TextChannel;
        if (message.webhookId || !message.member || message.author.bot) return;
        //로그 부분
        console.log(message.guild?.name + "[" + channel.name + "] " + message.member.displayName + " : " + message.content);
        console.log(message.guild?.id + " " + message.channel.id);

        const [msg, ...rest]: string[] = message.content.replace(await prefix(message.guildId!!), '').split(" ");
        const content: string = rest.join(" ").trim();
        const command = (name:string) => (client.messageCommands.get(name));
        const commonCommand = (name:string) => (client.commonCommands.get(name));
        const secCommand = duplicatedCommand.find(e=>{
            if(e)
            return Object.values(e).find(v=>v.includes(msg))
        });
        executeCommand(message);
        if(message.content.startsWith(await prefix(message.guildId!!))) {
            if(client.commonCommands.get(msg))
                await commonCommand(msg)!!(message, msg, content);
            if (client.messageCommands.has(msg)) {
                if(client.messageCommands.get(msg)?.execute)
                await command(msg)!!.execute!!(message, msg, content);
            } else if (secCommand) {
                const mainCommand = Object.keys(secCommand)[0];
                await command(mainCommand)!!.execute!!(message, msg, content);
            }
        }
    }
})