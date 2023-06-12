import { Message, EmbedBuilder } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';

export default new MessageCommand({
    data: {
        name: "playing",
        duplicatedData:["듣는곡","큐"],
        description: "현재 재생중인 곡",
    },
    async execute(message:Message) {
        if(!queue.get(message.guildId!!)){
            await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        }
        else{
            await message.reply({ content:'`현재 재생중인 곡 정보`',embeds:[await queue.get(message.guildId!!)!!.playing()]})
        }
    }
})