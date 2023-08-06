import {Command} from "../../structures/Command";
import {
    ButtonInteraction,
    CommandInteraction,
    EmbedBuilder,
    Message,
    SlashCommandBuilder,
    VoiceBasedChannel
} from "discord.js";
import {playlistOption, Queue, queue} from "../../plugins/lavalink/manageQueue";
import {createButtonSet, createModal, createStringSelectMenuBuilder} from "../../plugins/discord/interactions";
import fs, {readdirSync, readFile, readFileSync, writeFileSync} from "fs";
import {Track} from "shoukaku";
import {createListEmbeds} from "../../plugins/discord/manageEmbed";
import {PagedButton} from "../../plugins/discord/buttonPage";
import {Logger} from "../../plugins/common/logger";

interface data {
    [key: string]: string[];
}

class exec_data {
    readonly interaction: CommandInteraction | Message;
    readonly path: string;

    constructor(interaction: CommandInteraction | Message) {
        this.interaction = interaction;
        this.path = "./db/music/"
    }

    private checkFile(userId: string) {
        const fileList = readdirSync(this.path);
        return fileList.includes(userId + ".list");
    }

    private saveButton(interaction: ButtonInteraction) {
        if (!queue.get(interaction.guildId!!)) {
            interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
            return;
        } else {
            createModal(interaction, {
                title: "이름을 정해주세요",
                inputs: [
                    {
                        label: "재생목록 이름",
                        length: [0, 20],
                        placeholder: "재생목록 이름을 정해주세요",
                        required: true,
                        style: 1
                    }
                ]
            })
                .then(async ({interaction, inputs}) => {
                    const name = inputs[0];
                    const path = this.path + interaction.user!!.id + ".list";
                    if (this.checkFile(interaction.user!!.id)) {
                        const data = JSON.parse(fs.readFileSync(path).toString());
                        data[name] = [...queue.get(interaction.guildId!!)!!.data.playList.map(e => e.track)];
                        fs.writeFileSync(
                            path,
                            JSON.stringify(data, null, 3)
                        )
                    } else {
                        fs.writeFileSync(
                            path,
                            JSON.stringify({[name]: [...queue.get(interaction.guildId!!)!!.data.playList.map(e => e.track)]}, null, 3)
                        )
                    }
                    await interaction.reply({embeds: [new EmbedBuilder().setColor(0x426cf5).setTitle("저장되었습니다").setDescription("`" + name + "`")]})
                })
        }
    }

    private loadButton(interaction: ButtonInteraction) {
        if (!this.checkFile(interaction.user!!.id)) interaction.reply("`저장된 재생목록이 없습니다!`");
        else {
            const _interaction = this.interaction;
            const list: data = JSON.parse(String(readFileSync(`${this.path}${interaction.user.id}.list`)))
            const nameList = Object.keys(list);
            const menu = createStringSelectMenuBuilder({
                id: interaction.id+"_1",
                options: nameList.map((e, i) => {
                    return {label: e, value: String(i)}
                }),
                async execute({interaction}) {

                    const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(interaction.user.id)!!.voice.channel
                    if (!queue.get(interaction.guildId!!)) {
                        if (!voiceChannel) {
                            await interaction.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
                            return;
                        }
                        queue.set(interaction.guildId!!, new Queue(interaction.channelId!!, interaction.guild!!.id, voiceChannel.id));
                    }

                    const value = parseInt(interaction.values[0]);
                    const nowQueue = queue.get(interaction.guildId!!)!!;
                    const savedTrack = list[nameList[value]];
                    const trackData = await Promise.all(savedTrack.map(async e => (await nowQueue.getTrack(e)) as Track))
                    const embedList = [...new createListEmbeds({
                        title: '✅ | 재생목록에 추가되었습니다',
                        list: [...trackData.map(e => e.info.title)],
                        showIndex: true,
                        color: "Yellow",
                    }).create()]
                    const page = new PagedButton({
                        start: 1,
                        end: embedList.length,
                        showIndex: true
                    }).options({
                        embeds: [embedList[0]]
                    }).on("pageUpdate", (message: Message, org: number, idx: number) => {
                        Logger.debug("track 에서 업데이트됨"+message.id)
                        message.edit({
                            embeds: [embedList[idx - 1]]
                        })
                    })
                    await interaction.deferUpdate();
                    await page.send(_interaction,true);
                    await queue.get(interaction.guildId!!)!!.trackPlay(trackData);

                }
            })
            interaction.reply({
                embeds: [new EmbedBuilder().setTitle("재생목록을 선택해 주세요").setDescription(nameList.map((e, i) => "`" + String(i + 1) + "` | " + e).join("\n")).setColor("#FFFF00")],
                components: [menu]
            })
        }
    }

    public removeButton(interaction: ButtonInteraction) {
        const fileList: string[] = readdirSync(this.path);
        const file: string | false = fileList.find(e => e.includes(interaction.user.id + ".list")) ?? false;
        if (!file) interaction.reply("`저장된 재생목록이 없습니다!`");
        else {
            const _this = this;
            const list: data = JSON.parse(String(readFileSync(`${this.path}${interaction.user.id}.list`)))
            const nameList = Object.keys(list);
            const menu = createStringSelectMenuBuilder({
                id: interaction.id,
                options: nameList.map((e, i) => {
                    return {label: e, value: String(i)}
                }),
                async execute({interaction}) {
                    const value = parseInt(interaction.values[0]);
                    const name = nameList[value];
                    delete list[nameList[value]];
                    await writeFileSync(`${_this.path}${interaction.user.id}.list`, JSON.stringify(list, null, 3))
                    interaction.reply({embeds: [new EmbedBuilder().setTitle("해당 재생목록이 삭제되었습니다").setDescription(`\`${name}\``).setColor("#FF0000")]})

                }
            })
            interaction.reply({
                embeds: [new EmbedBuilder().setTitle("삭제할 목록을 선택해 주세요").setDescription(nameList.map((e, i) => "`" + String(i + 1) + "` | " + e).join("\n")).setColor("#FF0000")],
                components: [menu]
            })
        }
    }

    public async send() {
        const _this = this;
        const button = createButtonSet(this.interaction.id, [
            {
                label: '저장',
                style: 1,
                async execute({interaction, kill}) {
                    if (queue.get(interaction.guildId!!))
                        await _this.saveButton(interaction);
                    else
                        interaction.reply({content: "재생 중이 아닙니다", ephemeral: true});
                }
            },
            {
                label: '로드',
                style: 1,
                async execute({interaction, kill}) {
                    await _this.loadButton(interaction);
                }
            },
            {
                label: '삭제',
                style: 1,
                async execute({interaction, kill}) {
                    await _this.removeButton(interaction);
                }
            }
        ])

        const sendEmbed = new EmbedBuilder()
            .setTitle("수행할 작업을 선택해주세요")
            .setDescription("저장: 현재 재생목록을 저장합니다\n로드: 현재 재생목록에 저장된 재생목록을 불러옵니다\n삭제: 저장된 재생목록을 삭제합니다")
            .setColor("#426cf5")
        this.interaction.reply({embeds: [sendEmbed], components: [button]})
    }

}


export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('track')
            .setDescription('재생목록 설정'),
        async execute(interaction) {
            await new exec_data(interaction).send();
        }
    },
    message: {
        data: {
            name: "track",
            description: "재생목록 설정",
            duplicatedData: ["트랙", "트랙설정"],
        },
        async execute(message) {
            await new exec_data(message).send();
        }
    }
})