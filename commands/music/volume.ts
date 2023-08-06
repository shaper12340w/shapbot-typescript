import {
    SlashCommandBuilder,
    CommandInteraction,
    VoiceBasedChannel,
    EmbedBuilder,
    CommandInteractionOptionResolver,
    Message
} from 'discord.js';
import {Command} from '../../structures/Command'
import {queue} from '../../plugins/lavalink/manageQueue';
import {client} from "../../app";
import {ServerProperty} from "../../structures/Property";

async function execute_data(interaction: CommandInteraction | Message, content: string) {
    const user = (interaction instanceof Message) ? interaction.author : interaction.user
    const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(user.id)!!.voice.channel
    const query = content;
    if (!voiceChannel) {
        await interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
        return;
    }
    if (!queue.get(interaction.guildId!!)) {
        await interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
    } else {
        if (!query) {
            const volume = queue.get(interaction.guildId!!)!!.volume();
            await interaction.reply({embeds: [new EmbedBuilder().setColor(0xdbce39).setTitle(`:speaker: | 현재 볼륨 : ${volume}%`)]})
        } else {
            const queryInt = isNaN(parseInt(query)) ? false : parseInt(query);
            if (queryInt === false) {
                await interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 숫자를 입력해 주세요")]});
            } else {
                const volume = queue.get(interaction.guildId!!)!!.volume(queryInt);
                await interaction.reply({embeds: [new EmbedBuilder().setColor(0xdbce39).setTitle(`:speaker: | 볼륨이 ${volume}% 로 설정되었습니다`)]})
                await ServerProperty.save(interaction.guildId!!,{player: {volume: String(volume!!)}});
            }

        }

    }
}

export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('volume')
            .setDescription('재생중인 곡의 볼륨을 정합니다')
            .addStringOption(option =>
                option.setName('volume')
                    .setDescription('볼륨(숫자만)')),
        async execute(interaction: CommandInteraction) {
            await execute_data(interaction, (interaction.options as CommandInteractionOptionResolver).getString('volume')!!)
        },
    },
    message: {
        data: {
            name: "volume",
            duplicatedData: ["볼륨", "음량"],
            description: "볼륨을 설정합니다",
        },
        async execute(message: Message, args: string, content?: string) {
            await execute_data(message, content!!)
        }

    }
})