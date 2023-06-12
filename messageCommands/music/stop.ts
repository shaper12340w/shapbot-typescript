import { Message, EmbedBuilder } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
export default new MessageCommand({
	data: {
        name: "stop",
        duplicatedData:["정지","멈춰","나가"],
        description: "음악을 멈춥니다",
    },
	async execute(message:Message) {
        if(!queue.get(message.guildId!!)){
            await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            const stop = queue.get(message.guildId!!)!!.stop();
            if(stop){
                await message.reply({embeds:[new EmbedBuilder().setColor(0x426cf5).setTitle("⏹ | 노래를 멈춥니다")]})
            } 
        }
	},
});