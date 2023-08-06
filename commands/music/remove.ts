import {APISelectMenuOption, CommandInteraction, EmbedBuilder, Message, SlashCommandBuilder} from 'discord.js';
import {Command} from '../../structures/Command'
import {playlistOption, queue} from '../../plugins/lavalink/manageQueue';
import {createStringSelectMenuBuilder} from '../../plugins/discord/interactions';
import {createListEmbeds} from "../../plugins/discord/manageEmbed";
import {PagedButton} from "../../plugins/discord/buttonPage";


async function execute_data(interaction: CommandInteraction | Message) {
    if (!queue.get(interaction.guildId!!)) {
        await interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
    } else {
        const playlist = queue.get(interaction.guildId!!)!!.data.playList
        const playlistLeft = playlist.filter(e => e.status !== 2);
        if (playlist.length <= 1) {
            await interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 남은 곡이 1개 이하입니다!")]});
        } else {
            const chunkNumber = 15;
            const dividedList: playlistOption[][] = createListEmbeds.chunkArray(playlistLeft, chunkNumber);
            const embedList = new createListEmbeds({
                title: "재거할 곡을 골라주세요",
                subtitle: "**[전체목록]**",
                list: playlistLeft.map(e => "`" + (e.status === 1 ? "🟩" : "🟥") + "` " + e.name),
                chunkNumber: chunkNumber,
                color: 0xe01032,
                showIndex: false
            }).create()
            const musiclist = dividedList.map((e, i) => createStringSelectMenuBuilder({
                    id: "musiclist",
                    placeholder: "재생할 곡을 골라주세요",
                    options: new Array(dividedList[i].length).fill(null).map((_, _i) => {
                        const realNumber = i * chunkNumber + _i;
                        return <APISelectMenuOption>{
                            label: playlistLeft[realNumber] ? playlistLeft[realNumber].name : "undefined",
                            value: String(realNumber)
                        }
                    }),
                    async execute({interaction}) {
                        const index = Number(interaction.values[0]);
                        queue.get(interaction.guildId!!)!!.data.playList = queue.get(interaction.guildId!!)!!.data.playList.reduce((acc, num) => {
                            const name = playlist.filter(e => e.status !== 2)[index];
                            if (JSON.stringify(num) !== JSON.stringify(name)) {
                                acc.push(num);
                            }
                            return acc;
                        }, <playlistOption[]>[]);
                        await interaction.channel!!.send("해당 곡이 전체 재생목록에서 제거되었습니다")
                        await sendMessage!!.delete();
                        await interaction.deferUpdate();
                    }
                })
            )
            const listMessage = new PagedButton({
                start: 1,
                end: embedList.length,
                showIndex: true
            }).options({
                embeds: [embedList[0]],
                components: [musiclist[0]]
            }).on("pageUpdate", (message: Message, org: number, idx: number) => {
                message.edit({
                    embeds: [embedList[idx - 1]],
                    components: [...message.components as any, musiclist[idx - 1]]
                })
            })
            const sendMessage = await listMessage.send(interaction)
        }
    }
}
export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('remove')
            .setDescription('곡 목록'),
        async execute(interaction: CommandInteraction) {
            await execute_data(interaction)
        }
    },
    message: {
        data: {
            name: "remove",
            duplicatedData: ["제거", "삭제"],
            description: "재생목록에서 곡을 제거합니다",
        },
        async execute(message: Message) {
            await execute_data(message)
        }
    }
})