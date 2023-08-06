import {SlashCommandBuilder, CommandInteraction, VoiceBasedChannel, EmbedBuilder, Message} from 'discord.js';
import {Command} from '../../structures/Command'
import {queue} from '../../plugins/lavalink/manageQueue';

async function execute_data(interaction: CommandInteraction | Message) {
    const user = (interaction instanceof Message) ? interaction.author : interaction.user
    const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(user.id)!!.voice.channel
    if (!voiceChannel) {
        await interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
        return;
    }
    if (!queue.get(interaction.guildId!!)) {
        await interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
    } else {
        const skiped = await queue.get(interaction.guildId!!)!!.skip()!!;
        await interaction.reply({embeds: [new EmbedBuilder().setColor(0x426cf5).setTitle("⏭️ | 노래를 스킵합니다").setDescription("`" + skiped.title + "`")]})
    }

}

export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('skip')
            .setDescription('음악을 스킵합니다'),
        async execute(interaction: CommandInteraction) {
            await execute_data(interaction)
        }
    },
    message: {
        data: {
            name: "skip",
            duplicatedData: ["스킵", "다음곡"],
            description: "음악을 스킵합니다",
        },
        async execute(message: Message) {
            await execute_data(message)
        }
    }
});