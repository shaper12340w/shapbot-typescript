import { Message, TextChannel } from 'discord.js'
import { Event } from '../structures/Event'
import { executeCommand } from '../modules/common/extras';

const prefix = "!";

export default new Event({
    name: "messageCreate",
    async run(message: Message) {
        const channel = message.channel as TextChannel;
        if (message.webhookId || !message.member || message.author.bot) return;
        //로그 부분
        console.log(message.guild?.name + "[" + channel.name + "] " + message.member.displayName + " : " + message.content);
        console.log(message.guild?.id + " " + message.channel.id);

        const [msg, ...rest]: string[] = message.content.replace(prefix, '').split(" ");
        const content: string = rest.join(" ").trim();
        executeCommand(message)
        if (message.content.startsWith(prefix)) {
            console.log(content);
            switch (msg) {
                case "ㅎㅇ":
                    channel.send("ㅎㅇ");
                    break;
                case "재생":

                    break;
            }
        }
    }
})