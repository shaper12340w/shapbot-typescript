import {SlashCommandBuilder, CommandInteraction, VoiceBasedChannel, EmbedBuilder, Message} from 'discord.js';
import {Command} from '../../structures/Command'
import {queue} from '../../plugins/lavalink/manageQueue';

async function execute_data(interaction: CommandInteraction | Message) {
    if (!queue.get(interaction.guildId!!)) {
        interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
    } else {
        const stop = await queue.get(interaction.guildId!!)!!.stop();
        if (stop) {
            await interaction.reply({embeds: [new EmbedBuilder().setColor(0x426cf5).setTitle("⏹ | 노래를 멈춥니다")]})
        }
    }
}

export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('stop')
            .setDescription('음악을 정지합니다'),
        async execute(interaction: CommandInteraction) {
            await execute_data(interaction)
        }
    },
    message: {
        data: {
            name: "stop",
            duplicatedData: ["정지", "멈춰", "나가"],
            description: "음악을 멈춥니다",
        },
        async execute(message: Message) {
            await execute_data(message)
        }
    }

});