import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('recommend')
		.setDescription('추천 곡을 재생합니다'),
	async execute(interaction:CommandInteraction) {
		const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(interaction.user.id)!!.voice.channel
        if(!voiceChannel){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            if(queue.get(interaction.guildId!!)!!.data.option.playRecommend){
                interaction.reply({embeds:[{
                    color:0xeb3636,
                    title:"❌ | 추천 기능이 비활성화되었습니다."
                }]})
                queue.get(interaction.guildId!!)!!.data.option.playRecommend = 0;
            } else {
                interaction.reply({embeds:[{
                    color:0x36eb87,
                    title:"✅ | 추천 기능이 활성화되었습니다."
                }]})
                queue.get(interaction.guildId!!)!!.data.option.playRecommend = 1 ;
            }
        }
    }
})