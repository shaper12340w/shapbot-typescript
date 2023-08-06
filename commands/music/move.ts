import {
    SlashCommandBuilder,
    CommandInteraction,
    VoiceBasedChannel,
    EmbedBuilder,
    CommandInteractionOptionResolver, Message
} from 'discord.js';
import {Command} from '../../structures/Command'
import {queue} from '../../plugins/lavalink/manageQueue';
import {convertTimeToSeconds} from '../../plugins/common/extras';
import {client} from '../../app';
import {Track} from 'shoukaku';


async function execute_data(interaction: CommandInteraction | Message,content:string) {
    const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(
        interaction instanceof Message
        ? interaction.author.id
            : interaction.user.id
    )!!.voice.channel
    if (!voiceChannel) {
        interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
        return;
    }
    if (!queue.get(interaction.guildId!!)) {
        interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
    } else {
        const optionValue = content;
        const nowplayingValue = (await (() => {
            return new Promise<Track["info"]>(
                (resolve: (result: Track["info"]) => void,
                 reject: (reason: unknown) => void) => {
                    client.shoukaku.getIdealNode()!!.rest.decode(queue.get(interaction.guildId!!)!!.data.player!!.track!!)!!.then((e) => resolve(<Track["info"]>JSON.parse(JSON.stringify(e!!)))).catch(e => reject(e));
                })
        })());

        if (!isNaN(Number(optionValue))) {
            const secondsVal = parseInt(optionValue) * 1000;
            if (secondsVal < 0 || nowplayingValue.length < secondsVal) {
                interaction.reply(`\`\`\`\n현재 보낸 ${optionValue}초는 해당 곡의 길이\n${Math.round(nowplayingValue.length / 1000)}초 보다 깁니다!\`\`\``)
            } else {
                queue.get(interaction.guildId!!)!!.data.player!!.seekTo(secondsVal);
                interaction.reply(`\`\`\`\n${optionValue}초로 이동 완료!\`\`\``)
            }
        } else {
            try {
                const remakedVal = convertTimeToSeconds(optionValue);
                if (remakedVal < 0 || nowplayingValue.length < remakedVal) {
                    interaction.reply(`\`\`\`\n현재 보낸 ${optionValue}는 해당 곡의 길이\n${Math.round(nowplayingValue.length / 1000)}초 보다 깁니다!\`\`\``)
                } else {
                    queue.get(interaction.guildId!!)!!.data.player!!.seekTo(remakedVal * 1000);
                    interaction.reply(`\`\`\`\n${optionValue}로 이동 완료!\`\`\``)
                }
            } catch (e: unknown) {
                interaction.reply(`\`\`\`\n형식이 옳지 않습니다\n예시: 3분 3초\`\`\``)
            }

        }
    }
}

export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('move')
            .setDescription('해당 동영상의 시간으로 이동합니다')
            .addStringOption(option =>
                option.setName('time')
                    .setDescription('초(숫자만) 또는 ~시간 ~분 ~초(이 중 하나가 없어도 작동)')
                    .setRequired(true)),
        async execute(interaction: CommandInteraction) {
            await execute_data(interaction,(interaction.options as CommandInteractionOptionResolver).getString('time')!!);
        }
    },
    message: {
        data: {
            name: "move",
            duplicatedData: ["움직여", "시간", "부터"],
            description: "해당 동영상의 시간으로 이동합니다",
        },
        async execute(message: Message, args: string, content?: string) {
            await execute_data(message,content!!);
        }
    }
})