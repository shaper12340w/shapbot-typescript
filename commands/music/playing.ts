import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('playing')
        .setDescription('현재 재생중인 곡'),
    async execute(interaction:CommandInteraction) {
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        }
        else{
            interaction.reply({ content:'`현재 재생중인 곡 정보`',embeds:[await queue.get(interaction.guildId!!)!!.playing()]})
        }
    }
})