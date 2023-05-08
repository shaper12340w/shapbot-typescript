import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('음악을 스킵합니다'),
	async execute(interaction:CommandInteraction) {
		const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(interaction.user.id)!!.voice.channel
        if(!voiceChannel){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            const skiped = await queue.get(interaction.guildId!!)!!.skip()!!;
            interaction.reply({embeds:[new EmbedBuilder().setColor(0x426cf5).setTitle("⏭️ | 노래를 스킵합니다").setDescription("`"+   skiped.title+"`")]})
        }
	},
});