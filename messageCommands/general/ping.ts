import { MessageCommand } from "../../structures/Command";
import { Message } from "discord.js";

export default new MessageCommand({
    data: {
        name: "ping",
        duplicatedData:["핑"],
        description: "Pong!",
    },
    async execute(message:Message,args:string,content?:string){
        await message.reply("Pong!");
    }
});