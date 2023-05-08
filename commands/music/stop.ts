import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
export default new Command({
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('음악을 정지합니다'),
	async execute(interaction:CommandInteraction) {
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            const stop = queue.get(interaction.guildId!!)!!.stop();
            if(stop){
                interaction.reply({embeds:[new EmbedBuilder().setColor(0x426cf5).setTitle("⏹ | 노래를 멈춥니다")]})
            } 
        }
	},
});