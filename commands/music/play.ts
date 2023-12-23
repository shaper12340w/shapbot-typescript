import {
    SlashCommandBuilder,
    CommandInteraction,
    CommandInteractionOptionResolver,
    VoiceBasedChannel,
    EmbedBuilder,
    MessageReplyOptions,
    APIEmbed, Message, APIApplicationCommandOptionChoice, MessagePayload, MessageComponentInteraction
} from 'discord.js';
import {Command} from '../../structures/Command'
import {Queue} from '../../plugins/lavalink/manageQueue';
import {queue} from '../../plugins/lavalink/manageQueue';
import {createListEmbeds, makeEmbed} from '../../plugins/discord/manageEmbed';
import {LavalinkResponse, LoadType, Playlist, Track} from 'shoukaku';
import {PagedButton} from "../../plugins/discord/buttonPage";
import {Logger} from "../../plugins/common/logger";


const numberList = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

interface ReturnEmbedData extends MessageReplyOptions {
    content: string;
    embeds: APIEmbed[]
}

async function processResult(interaction: CommandInteraction|Message, queue: Queue, query: string, platform?: string|null) {
    const searchResult = await queue.search(query, platform === null ? undefined:platform) as LavalinkResponse;
    const replyOption = (intraction:string | MessagePayload | MessageReplyOptions) =>{
        if(interaction instanceof Message)
            return interaction.reply(intraction)
        else
            return interaction.editReply(intraction)
    }
    const user = (interaction instanceof Message) ? interaction.author:interaction.user
    switch (searchResult.loadType) {
        case LoadType.EMPTY:
            await replyOption({embeds: [new EmbedBuilder().setColor("#ffb000").setTitle("❗ | 검색 결과가 없습니다")]})
            break;
        case LoadType.ERROR:
            await replyOption({embeds: [new EmbedBuilder().setColor("#ef3b3b").setTitle("❌ | 처리 도중 에러가 발생했습니다").setDescription(searchResult.data.message)]})
            break;
        case LoadType.TRACK:
            const trackValue = await queue.play(searchResult.data)!!
            await replyOption({embeds: [trackValue.embed!!]})
            break;
        case LoadType.PLAYLIST:
            await queue.trackPlay(searchResult.data.tracks)
            const chunkedEmbed = new createListEmbeds({
                title: `:notes:| ${searchResult.data.info.name}`,
                list: searchResult.data.tracks.map(e => e.info.title),
                chunkNumber: 15,
                showIndex: true,
            }).create()
            const button = new PagedButton({
                start: 1,
                end: chunkedEmbed.length,
                showIndex: true
            }).options({
                embeds: [chunkedEmbed[0]],
                content: "`목록이 추가되었습니다`"
            }).on('pageUpdate', (message: Message, org: number, idx: number) => {
                message.edit({
                    embeds: [chunkedEmbed[idx - 1]],
                });
            });
            await button.send(interaction);

            break;
        case LoadType.SEARCH:
            const _searchResult = searchResult;

        async function process(index: number): Promise<ReturnEmbedData> {
            const data = await queue.play(_searchResult.data[index])
            const embed = Object.assign({}, data!!.embed!!);
            embed.footer!!.text = user.tag
            embed.footer!!.icon_url = interaction.guild!!.members.cache.get(user.id)!!.displayAvatarURL();
            return <ReturnEmbedData>{
                content: `${data!!.desc!! === "add" ? "\`추가되었습니다\`" : "\`신규 재생\`"}`,
                embeds: [embed]
            }
        }

            if (searchResult.data.length === 1) {
                const result = await process(0);
                await replyOption(result as unknown as MessagePayload);
                break;
            } else if (searchResult.data.length > 1) {
                const sendMessage = await replyOption({
                    embeds: [makeEmbed("곡을 선택해주세요", searchResult.data.slice(0, 9).map((e, i) => {
                        return numberList[i] + " | " + e.info.title
                    }).join("\n")!!, "blue")!!.setFooter({text: '원하는 결과가 없을 경우 "취소"를 입력'})]
                })
                const deleteOption = () => {
                    if(interaction instanceof Message)
                        return sendMessage.delete()
                    else
                        return interaction.deleteReply()
                }

                await interaction.channel!!.awaitMessages({
                    filter: m => m.author.id === user.id,
                    max: 1,
                    time: 15000,
                    errors: ["time"]
                })
                    .then(async (response) => {
                        const message = response.first()!!;
                        const numMessage = parseInt(message.content.slice(0, 1));
                        if (message.content === "취소") {
                            await deleteOption();
                            interaction.channel!!.send({embeds: [makeEmbed("곡 선택이 취소되었습니다!", "취소됨", "yellow", 0)!!]})
                            return;
                        } else if (numMessage > 0 && numMessage < 10) {
                            await deleteOption();
                            message.delete().catch();
                            const result = await process(numMessage - 1);
                            interaction.channel!!.send(result);
                        }
                    })
                    .catch(async (err: unknown) => {
                        Logger.error(err)
                        const result = await process(0);
                        await replyOption({embeds: [makeEmbed("선택하지 않아 자동으로 1번이 선택되었습니다", "`" + result.embeds[0].title + "`", "yellow", ":grey_exclamation:")]})
                        interaction.channel!!.send(result);
                    })
            }
    }
}

export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('play')
            .setNameLocalizations({
                "ko": "재생",
            })
            .setDescription('곡을 재생합니다!')
            .addStringOption(option =>
                option.setName('search_or_link')
                    .setDescription('찾을 곡 이름 또는 링크')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('platform')
                    .setDescription('검색할 플랫폼')
                    .setChoices(
                        {name: "youtube", value: "youtube"},
                        {name: "soundcloud", value: "soundcloud"}
                    )),

        async execute(interaction: CommandInteraction) {
            const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(interaction.user.id)!!.voice.channel
            const query: string = (interaction.options as CommandInteractionOptionResolver).getString('search_or_link')!!;
            const platform:string|null = (interaction.options as CommandInteractionOptionResolver).getString('platform');
            await interaction.deferReply();
            if (!voiceChannel) {
                await interaction.editReply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
                return;
            }
            if (!queue.get(interaction.guildId!!)) {
                queue.set(interaction.guildId!!, new Queue(interaction.channelId!!, interaction.guild!!.id, voiceChannel.id));
                await processResult(interaction, queue.get(interaction.guildId!!)!!, query, platform)
            } else {
                await processResult(interaction, queue.get(interaction.guildId!!)!!, query, platform)
            }
        }
    },
    message: {
        data: {
            name: "play",
            duplicatedData: ["재생", "노래", "틀어줘"],
            description: "곡을 재생합니다",
        },

        async execute(message: Message, args: string, options?: string) {
            const voiceChannel: VoiceBasedChannel | null = message.guild!!.members.cache.get(message.author.id)!!.voice.channel
            const query: string = options!!;
            if (!voiceChannel) {
                await message.reply({embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
                return;
            }
            if (!queue.get(message.guildId!!)) {
                queue.set(message.guildId!!, new Queue(message.channelId!!, message.guild!!.id, voiceChannel.id));
                await processResult(message, queue.get(message.guildId!!)!!, query)
            } else {
                await processResult(message, queue.get(message.guildId!!)!!, query)
            }
        },
    }
});