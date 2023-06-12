import {Message, EmbedBuilder, VoiceBasedChannel } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';

export default new MessageCommand({
	data: {
        name: "recommend",
        duplicatedData:["추천","추천곡"],
        description: "음악 추천 기능을 활성화/비활성화합니다",
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
            if(queue.get(message.guildId!!)!!.data.option.playRecommend){
                await message.reply({embeds:[{
                    color:0xeb3636,
                    title:"❌ | 추천 기능이 비활성화되었습니다."
                }]})
                queue.get(message.guildId!!)!!.data.option.playRecommend = 0;
            } else {
                await message.reply({embeds:[{
                    color:0x36eb87,
                    title:"✅ | 추천 기능이 활성화되었습니다."
                }]})
                queue.get(message.guildId!!)!!.data.option.playRecommend = 1;
            }
        }
    }
})