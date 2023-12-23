import {
    SlashCommandBuilder,
    CommandInteraction,
    CommandInteractionOptionResolver,
    APIApplicationCommandOptionChoice,
    Message, EmbedBuilder, ButtonStyle, APISelectMenuOption, AutocompleteInteraction
} from 'discord.js';
import {Command} from '../../structures/Command'
import {GenerateServerType, GenerateType, ImageGenerate} from "../../plugins/image/imageGenerate";
import {ArtivaModel, AspectRatio, Sampler} from "../../plugins/image/types/GeneralTypes";
import {UpscaleType} from "../../plugins/image/types/ImageUpscaleTypes";
import {createButtonSet, createModal, createStringSelectMenuBuilder} from "../../plugins/discord/interactions";
import {Logger} from "../../plugins/common/logger";

const reModelList: APIApplicationCommandOptionChoice<string>[] = Object.values(ArtivaModel).map((value) => {
    return {name: `${value}`, value: value};
});

const reSamplerList: APIApplicationCommandOptionChoice<string>[] = Object.values(Sampler).flatMap(value => {
    return [
        {name: value, value: value},
        {name: value + "_karras", value: value + "_karras"}
    ];
});

const reUpscalerList: APIApplicationCommandOptionChoice<string>[] = Object.values(UpscaleType).map(value => {
    return {name: value, value: value}
})

const killList: (() => void)[] = []

const _reModelList: APISelectMenuOption[] = Object.values(ArtivaModel).map((value) => {
    return {label: `${value}`, value: value};
});

const _reSamplerList: APISelectMenuOption[] = Object.values(Sampler).flatMap(value => {
    return [
        {label: value, value: value},
        {label: value + "_karras", value: value + "_karras"}
    ];
});

const _reUpscalerList: APISelectMenuOption[] = Object.values(UpscaleType).map(value => {
    return {label: value, value: value}
})

const _reRatioList: APISelectMenuOption[] = [
    {label: "Square (1:1)", value: "square"},
    {label: "Portrait (2:3)", value: "portrait"},
    {label: "Landscape (3:2)", value: "landscape"}
];
export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('draw')
            .setNameLocalizations({
                "ko": "그리기"
            })
            .setDescription('이미지를 생성합니다')
            .addStringOption(option =>
                option.setName('model')
                    .setDescription('모델')
                    .setRequired(true)
                    .addChoices(...reModelList)
            )
            .addStringOption(option =>
                option.setName('prompt')
                    .setDescription('프롬프트 혹은 명령')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('negative')
                    .setDescription('부정 프롬프트')
            )
            .addStringOption(option =>
                option.setName('ratio')
                    .setDescription('비율')
                    .addChoices(
                        {name: "Square (1:1)", value: AspectRatio.SQUARE},
                        {name: "Portrait (2:3)", value: AspectRatio.PORTRAIT},
                        {name: "Landscape (3:2)", value: AspectRatio.LANDSCAPE}
                    ))
            .addNumberOption(option =>
                option.setName('seed')
                    .setDescription('설정하고 싶은 시드')
            )
            .addStringOption(option =>
                option.setName('scheduler')
                    .setDescription("이미지를 더 나은 퀄리티로 재구성")
                    .addChoices(...reSamplerList)
            )
            .addNumberOption(option =>
                option.setName('step')
                    .setDescription('이미지를 추론 및 생성하는 수 (기본 20[권장]) | 1~50')
                    .setMinValue(1)
                    .setMaxValue(50)
            )
            .addBooleanOption(option =>
                option.setName('creativity')
                    .setDescription('이미지 세부 디테일보다 창의성을 중시하도록 설정')
            )
            .addNumberOption(option =>
                option.setName('similarity')
                    .setDescription('이미지와 프롬프트간 유사성을 조절합니다 (기본 30) | 1~100')
                    .setMinValue(1)
                    .setMaxValue(100)
            )
            .addStringOption(option =>
                option.setName('upscale')
                    .setDescription('이미지를 업스케일(더 높은 해상도)로 바꿔주는 모델을 선택합니다')
                    .addChoices(...reUpscalerList)
            )
            .addAttachmentOption(option =>
                option.setName('image')
                    .setDescription('이미지를 넣어 이미지를 재구성합니다')
            ),

        async execute(interaction: CommandInteraction) {
            const optionInteraction = interaction.options as CommandInteractionOptionResolver;
            const getStr = (optionName: string) => optionInteraction.getString(optionName)!!
            const getNum = (optionName: string) => optionInteraction.getNumber(optionName)!!
            const getBool = (optionName: string) => optionInteraction.getBoolean(optionName)!!
            const getAttach = (optionName: string) => optionInteraction.getAttachment(optionName)!!
            await ImageGenerate.generateDirect(
                {
                    // 유저 세팅 부분
                    userId: interaction.user.id,
                    channelId: interaction.channelId,
                    //이미지 설정 부분
                    model: getStr('model') as ArtivaModel,
                    prompt: getStr('prompt'),
                    negativePrompt: getStr('negative'),
                    imageUrl: getAttach('image') ? getAttach('image').url : undefined,
                    ratio: getStr('ratio') as AspectRatio,
                    seed: getNum('seed'),
                    scheduler: getStr('scheduler') as (Sampler | `${Sampler}_karras`),
                    step: getNum('step') as (number & { __lt50: true }),
                    creativity: getBool('creativity'),
                    similarity: getNum('similarity') as (number & { __lt100: true }),
                    upscale: getStr('upscale') as UpscaleType,
                },
                interaction
            )

        },

    },
    message: {
        data: {
            name: "draw",
            duplicatedData: ["그려", "이미지", "노블"],
            description: "이미지를 생성합니다",
        },
        async execute(message: Message, args: string, content?: string) {
            let detailedEmbedQueue: Message | undefined;

            const returnData: GenerateType & GenerateServerType = {
                //GenerateServerType
                userId: message.author.id,
                channelId: message.channelId,
                //GenerateType
                model: ArtivaModel.ANYTHING_V5,
                prompt: "",
            }
            const descriptionEmbed = new EmbedBuilder()
                .setColor(0x8088ff)
                .setDescription("## 이미지 생성\n### 필수 조건\n- 모델 : 이미지 생성에 필요한 모델을 설정합니다\n- 프롬프트 : 이미지 생성에 필요한 명령입니다\n### 추가 조건\n- 부정 프롬프트 : 이미지에 적용하지 않을 명령을 설정합니다.\n- 비율 : 이미지의 비율을 설정합니다 (기본 1:1)\n- 시드 : 이미지의 시드 값을 설정합니다\n- 셈플러 : 이미지를 셈플링하여 더 좋은 퀄리티로 만들어줍니다.\n- 단계 : 이미지를 추론 및 생성하여 더 좋은 이미지를 만듭니다(기본 20[권장]) | 1~50\n- 창의성 : 이미지의 세부 디테일보다 창의성을 중시하도록 설정합니다.\n- 유사성 : 이미지와 프롬프트간 유사성을 조절합니다 (기본 30) | 1~100\n- 업스케일 : 이미지를 업스케일(더 높은 해상도)로 바꿔주는 모델을 선택합니다")
            const dataEmbed = (newData: GenerateType & GenerateServerType) => new EmbedBuilder()
                .setColor("#e1a028")
                .setDescription(`## 현재 설정된 정보\n${JSON.stringify(newData, null, 3)}`)
            //interaction.update({components:[edit({disabled : true},{},{},{})]}) 각각 모델,프롬,세부 설정,생성 으로 만들 예정
            const main_button = createButtonSet(message.id, [
                //model button
                {
                    label: "모델",
                    style: ButtonStyle.Success,
                    async execute({interaction, edit, kill}) {
                        killList.push(kill);
                        const modelSelector = createStringSelectMenuBuilder({
                            id: interaction.id,
                            placeholder: "모델을 선택해주세요",
                            options: [..._reModelList],
                            execute({interaction}) {
                                const [value] = interaction.values;
                                returnData.model = value as ArtivaModel;
                                repliedMessage.delete()
                                interaction.deferUpdate()
                            }
                        })
                        await sendMessage.edit({embeds: [descriptionEmbed, dataEmbed(returnData)]})
                        const repliedMessage = await interaction.reply({
                            content: "### 모델을 선택해 주세요",
                            components: [modelSelector],
                            fetchReply: true
                        })
                    }
                },
                {
                    //prompt button
                    label: "프롬프트",
                    style: ButtonStyle.Success,
                    execute({interaction, edit, kill}) {
                        killList.push(kill);
                        createModal(interaction, {
                            title: "프롬프트",
                            inputs: [
                                {
                                    label: "프롬프트",
                                    required: true,
                                    style: 2,
                                    placeholder: "프롬프트를 입력해 주세요"
                                }
                            ]
                        })
                            .then((value) => {
                                const [data] = value.inputs;
                                returnData.prompt = data;
                                sendMessage.edit({embeds: [descriptionEmbed, dataEmbed(returnData)]})
                                value.interaction.deferUpdate()
                            })
                            .catch((reason) => {
                                Logger.error(reason)
                            })
                    }
                },
                {
                    label: "세부 설정",
                    style: ButtonStyle.Success,
                    async execute({interaction, edit, kill}) {
                        killList.push(kill);
                        const button_interaction = interaction;
                        const buttonSelect = createButtonSet(button_interaction.id,
                            [
                                {
                                    label: "세부 설정",
                                    style: ButtonStyle.Success,
                                    execute({interaction, edit, kill}) {
                                        killList.push(kill);
                                        createModal(interaction, {
                                            title: "세부 설정",
                                            inputs: [
                                                {
                                                    label: "부정 프롬프트",
                                                    style: 2,
                                                    placeholder: "부정 프롬프트를 입력해 주세요",
                                                    required: false
                                                },
                                                {
                                                    label: "시드",
                                                    style: 1,
                                                    placeholder: "(10자리 숫자)설정하고 싶은 시드",
                                                    required: false
                                                },
                                                {
                                                    label: "단계",
                                                    style: 1,
                                                    placeholder: "(1~50)이미지를 추론하는 수 (기본 20[권장])",
                                                    required: false
                                                },
                                                {
                                                    label: "유사성",
                                                    style: 1,
                                                    placeholder: "(1~100)이미지와 프롬프트간 유사성을 조절합니다 (기본 30)",
                                                    required: false
                                                },
                                            ]
                                        })
                                            .then((value) => {
                                                const [negative, seed, step, similarity] = value.inputs;
                                                returnData.negativePrompt = negative;
                                                if (isNaN(Number(seed)) ? false : seed.length === 0 ? false : seed.length !== 10)
                                                    value.interaction.reply({
                                                        ephemeral: true,
                                                        content: "시드 숫자가 올바르지 않습니다!"
                                                    })
                                                else if (isNaN(Number(step)) ? false : step.length === 0 ? false : Number(step) <= 50 && Number(step) >= 1)
                                                    value.interaction.reply({
                                                        ephemeral: true,
                                                        content: "단계 숫자가 올바르지 않습니다!"
                                                    })
                                                else if (isNaN(Number(similarity)) ? false : similarity.length === 0 ? false : Number(step) <= 100 && Number(step) >= 1)
                                                    value.interaction.reply({
                                                        ephemeral: true,
                                                        content: "유사성 숫자가 올바르지 않습니다!"
                                                    })
                                                else {
                                                    returnData.seed = seed.length > 0 ? parseInt(seed) : undefined;
                                                    returnData.step = step.length > 0 ? parseInt(step) as (number & {
                                                        __lt50: true
                                                    }) : undefined;
                                                    returnData.similarity = similarity.length > 0 ? parseInt(similarity) as (number & {
                                                        __lt100: true
                                                    }) : undefined
                                                }
                                                sendMessage.edit({embeds: [descriptionEmbed, dataEmbed(returnData)]})
                                                value.interaction.deferUpdate()
                                            })
                                            .catch((reason) => {
                                                Logger.error(reason)
                                            })
                                    }
                                }
                            ]
                        )
                        const ratioSelector = createStringSelectMenuBuilder({
                            id: interaction.id + "_1",
                            placeholder: "비율",
                            options: [..._reRatioList],
                            execute({interaction, kill}) {
                                killList.push(kill);
                                const [value] = interaction.values;
                                returnData.ratio = value as AspectRatio;
                                sendMessage.edit({embeds: [descriptionEmbed, dataEmbed(returnData)]})
                                interaction.deferUpdate()
                            }
                        })
                        const schedulerSelector = createStringSelectMenuBuilder({
                            id: interaction.id + "_2",
                            placeholder: "이미지를 더 나은 퀄리티로 재구성",
                            options: [..._reSamplerList],
                            execute({interaction, kill}) {
                                killList.push(kill);
                                const [value] = interaction.values;
                                returnData.scheduler = value as Sampler | `${Sampler}_karras`;
                                sendMessage.edit({embeds: [descriptionEmbed, dataEmbed(returnData)]})
                                interaction.deferUpdate()
                            }
                        })
                        const upscalerSelector = createStringSelectMenuBuilder({
                            id: interaction.id + "_3",
                            placeholder: '업스케일러 설정',
                            options: [..._reUpscalerList],
                            execute({interaction, kill}) {
                                killList.push(kill);
                                const [value] = interaction.values;
                                returnData.upscale = value as UpscaleType;
                                sendMessage.edit({embeds: [descriptionEmbed, dataEmbed(returnData)]})
                                interaction.deferUpdate()
                            }
                        })
                        const creativitySelector = createStringSelectMenuBuilder({
                            id: interaction.id + "_4",
                            placeholder: '창의성 설정',
                            options: [{label: "True", value: "1"}, {label: "False", value: "0"}],
                            execute({interaction, kill}) {
                                killList.push(kill);
                                const [value] = interaction.values;
                                returnData.creativity = Boolean(Number(value));
                                sendMessage.edit({embeds: [descriptionEmbed, dataEmbed(returnData)]})
                                interaction.deferUpdate()
                            }
                        })
                        const updated_data = await button_interaction.update({
                            components: [edit({}, {}, {disabled: true}, {})],
                            fetchReply: true
                        })
                        detailedEmbedQueue = updated_data;
                        await updated_data.reply({
                            content: "### 세부 설정",
                            components: [buttonSelect, ratioSelector, schedulerSelector, upscalerSelector, creativitySelector]
                        })
                    }
                },
                {
                    label: "생성!",
                    style: ButtonStyle.Success,
                    async execute({interaction, kill}) {
                        if (returnData.prompt.length === 0)
                            await interaction.reply({ephemeral: true, content: "프롬프트를 정해주세요!"})
                        if (detailedEmbedQueue)
                            await detailedEmbedQueue!!.edit('### 생성중')
                        killList.push(kill);
                        killList.forEach(e => e());
                        await ImageGenerate.generateDirect(returnData, sendMessage)
                        await message.delete()
                        await sendMessage.delete()
                        await interaction.deferUpdate()
                    }
                },
                {
                    label: "❌",
                    style: ButtonStyle.Danger,
                    async execute({interaction, kill}) {
                        if (detailedEmbedQueue)
                            await detailedEmbedQueue!!.delete()
                        killList.push(kill);
                        killList.forEach(e => e());
                        await message.channel.send("### 취소되었습니다");
                        await message.delete()
                        await sendMessage.delete();
                        await interaction.deferUpdate()
                    }
                }
            ])

            const sendMessage = await message.reply({
                embeds: [descriptionEmbed, dataEmbed(returnData)],
                components: [main_button]
            })


        }
    }
})