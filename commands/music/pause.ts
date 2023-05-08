import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('음악을 일시정지합니다'),
	async execute(interaction:CommandInteraction) {
		const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(interaction.user.id)!!.voice.channel
        if(!voiceChannel){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            const paused = queue.get(interaction.guildId!!)!!.pause()!!;
            if(paused === false){
                interaction.reply({embeds:[new EmbedBuilder().setColor(0x426cf5).setTitle("▶️ | 재생됨")]})
            } else if(paused === true) {
                interaction.reply({embeds:[new EmbedBuilder().setColor(0x426cf5).setTitle("⏸️ | 일시정지됨")]})
            } else {
                interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
            }
        }
	},
});