import { Message, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';

export default new MessageCommand({
	data:{
        name: "skip",
        duplicatedData:["스킵","다음곡"],
        description: "음악을 스킵합니다",
    },
	async execute(message:Message) {
		const voiceChannel: VoiceBasedChannel | null = message.guild!!.members.cache.get(message.author.id)!!.voice.channel
        if(!voiceChannel){
            await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(message.guildId!!)){
            await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            const skiped = await queue.get(message.guildId!!)!!.skip()!!;
            await message.reply({embeds:[new EmbedBuilder().setColor(0x426cf5).setTitle("⏭️ | 노래를 스킵합니다").setDescription("`"+   skiped.title+"`")]})
        }
	},
});