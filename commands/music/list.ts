import {
    SlashCommandBuilder,
    CommandInteraction,
    VoiceBasedChannel,
    EmbedBuilder,
    APISelectMenuOption,
    Message
} from 'discord.js';
import {Command} from '../../structures/Command'
import {playlistOption, queue} from '../../plugins/lavalink/manageQueue';
import {createStringSelectMenuBuilder} from '../../plugins/discord/interactions';
import {createListEmbeds} from "../../plugins/discord/manageEmbed";
import {PagedButton} from "../../plugins/discord/buttonPage";
import {Logger} from "../../plugins/common/logger";


async function list_command(interaction: CommandInteraction | Message) {
    if (!queue.get(interaction.guildId!!)) {
        interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
    } else {
        let sendMessage: Message | undefined
        const playlist = queue.get(interaction.guildId!!)!!.data.playList
        const nowPlaying = playlist.filter(e => e.status === 2)[0];
        const toplay = playlist.filter(e => e.status === 1);
        if (toplay.length === 0) {
            interaction.reply({embeds: [new EmbedBuilder().setColor(0xdbce39).setTitle(`${interaction.guild!!.name}의 재생목록`).setDescription(`**[현재 재생중]**\n▶️ | ${nowPlaying.name}`)]});
        } else {
            const playlist = queue.get(interaction.guildId!!)!!.data.playList // 전채 playlist
            const nowPlaying = playlist.filter(e => e.status === 2)[0]; //현재 재생중인 곡
            const toplay = playlist.filter(e => e.status === 1); // 대기목록
            if (toplay.length === 0) {
                await interaction.reply({embeds: [new EmbedBuilder().setColor(0xdbce39).setTitle(`${interaction.guild!!.name}의 재생목록`).setDescription(`**[현재 재생중]**\n▶️ | ${nowPlaying.name}`)]});
            } else {
                const chunkNumber = 15;
                const dividedList: playlistOption[][] = createListEmbeds.chunkArray(toplay, chunkNumber);
                const _embedList = new createListEmbeds({
                    title: `${interaction.guild!!.name}의 재생목록`,
                    subtitle: `**[현재 재생중]**\n▶️ | ${nowPlaying.name}\n\n**[재생목록]**`,
                    list: toplay.map((e, i) => "`" + String(i + 1) + "` | " + e.name),
                    chunkNumber: chunkNumber,
                    color: 0xdbce39,
                    showIndex: false
                }).create()
                const musiclist = dividedList.map((e, i) => createStringSelectMenuBuilder({
                    id: interaction.id + `_${i}`,
                    placeholder: "재생할 곡을 골라주세요",
                    options: new Array(dividedList[i].length).fill(null).map((_, _i) => {
                        const realNumber = i * chunkNumber + _i;
                        return <APISelectMenuOption>{
                            label: toplay[realNumber] ? toplay[realNumber].name : "undefined",
                            value: String(realNumber)
                        }
                    }),
                    async execute({interaction, kill}) {
                        try {
                            const index = Number(interaction.values[0]);
                            queue.get(interaction.guildId!!)!!.data.option.playNextOption = false;
                            queue.get(interaction.guildId!!)!!.data.playList.filter(e => e.status === 1)[index].status = 3;
                            queue.get(interaction.guildId!!)!!.data.playList.filter(e => e.status === 2)[0].status = 0;
                            queue.get(interaction.guildId!!)!!.data.playList.filter(e => e.status === 3)[0].status = 2;
                            const playdata = queue.get(interaction.guildId!!)!!.data.playList.filter(e => e.status === 2)[0];
                            queue.get(interaction.guildId!!)!!.data.player?.stopTrack()
                            queue.get(interaction.guildId!!)!!.data.player?.playTrack({track: playdata.track})
                            queue.get(interaction.guildId!!)!!.data.killList.push(kill);
                            await listButton!!.on('destroy', _ => {
                            });
                            await repliedMessage.delete()
                            await interaction.deferUpdate()
                            await interaction.channel!!.send({embeds: [playdata.embed]})
                        } catch (e) {
                            console.error(e)
                        }
                    }
                }))
                const listButton = new PagedButton({
                    start: 1,
                    end: _embedList.length,
                    showIndex: true
                }).options({
                    embeds: [_embedList[0]],
                }).on("pageUpdate", (message: Message, org: number, idx: number) => {
                    Logger.debug("List 에서 업데이트됨" + message.id)
                    message.edit({
                        embeds: [_embedList[idx - 1]],
                    })
                    listMessage.edit({components: [musiclist[idx - 1]]})
                })
                const repliedMessage = await listButton.send(interaction);
                const listMessage = await interaction.channel!!.send({components: [musiclist[0]]})
            }
        }
    }
}

export default new Command({
        interaction: {
            data: new SlashCommandBuilder()
                .setName('list')
                .setNameLocalizations({
                    "ko": "재생목록"
                })
                .setDescription('곡 목록'),
            async execute(interaction: CommandInteraction) {
                await list_command(interaction);

            }

        },
        message: {
            data: {
                name: "list",
                duplicatedData: ["리스트", "목록"],
                description: "곡 목록",
            },
            async execute(message: Message) {
                await list_command(message);
            }

        }
    }
)