import { Message, TextChannel } from 'discord.js'
import { client } from '../app';
import { Event } from '../structures/Event'
import { executeCommand } from '../modules/common/extras';
import { MessageCommandData } from "../structures/Client";

const prefix = (id:string) => client.serverProperty.get(id)!!.prefix;
const duplicatedCommand:{[p:string]:string[]}[] = client.messageCommands.map((command:MessageCommandData) => {
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

        const [msg, ...rest]: string[] = message.content.replace(prefix(message.guildId!!), '').split(" ");
        const content: string = rest.join(" ").trim();
        const command = (name:string) => (<MessageCommandData>client.messageCommands.get(name));
        const secCommand = duplicatedCommand.find(e=>Object.values(e).find(v=>v.includes(msg)));
        executeCommand(message);
        if(message.content.startsWith(prefix(message.guildId!!))) {
            if (client.messageCommands.has(msg)) {
                console.log(content);
                await command(msg).execute(message, msg, content);
            } else if (secCommand) {
                const mainCommand = Object.keys(secCommand)[0];
                await command(mainCommand).execute(message, msg, content);
            }
        }
    }
})