import { Message, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';

export default new MessageCommand({
    data: {
        name: "pause",
        duplicatedData:["일시정지"],
        description: "음악을 일시정지합니다",
    },
	async execute(message:Message) {
		const voiceChannel: VoiceBasedChannel | null = message.guild!!.members.cache.get(message.author.id)!!.voice.channel
        if(!voiceChannel){
            message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(message.guildId!!)){
            message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            const paused = queue.get(message.guildId!!)!!.pause()!!;
            if(!paused){
                message.reply({embeds:[new EmbedBuilder().setColor(0x426cf5).setTitle("▶️ | 재생됨")]})
            } else if(paused) {
                message.reply({embeds:[new EmbedBuilder().setColor(0x426cf5).setTitle("⏸️ | 일시정지됨")]})
            } else {
                message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
            }
        }
	},
});