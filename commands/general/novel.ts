import { SlashCommandBuilder, CommandInteraction, CommandInteractionOptionResolver,APIApplicationCommandOptionChoice} from 'discord.js';
import { Command } from '../../structures/Command'
import {ImageGenerate, ImageRequestDataType, modelList} from "../../modules/image/imageGenerate";

const reModelList:APIApplicationCommandOptionChoice<string>[] = Object.keys(modelList).map(name=>{
    return { name: `${modelList[name].desc}`, value: name, description:modelList[name].type }
})
export default new Command({
    data: new SlashCommandBuilder()
        .setName('novel')
        .setDescription('이미지를 생성합니다')
        .addStringOption(option =>
            option.setName('model')
                .setDescription('모델 및 프롬프트를 입력해 주세요')
                .setRequired(true)
                .addChoices(...reModelList))
        .addStringOption(option=>
            option.setName('prompt')
                .setDescription('프롬프트 혹은 명령을 입력해 주세요')
                .setRequired(true))
        .addStringOption(option=>
            option.setName('negative')
                .setDescription('네거티브 프롬프트 (선택적)'))
        .addStringOption(option=>
            option.setName('ratio')
                .setDescription('비율을 선택해 주세요')
                .addChoices(
                    { name:"Square (1:1)", value:"square" },
                    { name:"Portrait (2:3)", value:"portrait" },
                    { name:"Landscape (3:2)", value:"landscape" }
                )
        ),


    async execute(interaction:CommandInteraction){
        const query:string = (interaction.options as CommandInteractionOptionResolver).getString('model')!!;
        const prm:string = (interaction.options as CommandInteractionOptionResolver).getString('prompt')!!;
        const nprm:string|null = (interaction.options as CommandInteractionOptionResolver).getString('negative');
        const rto:string|null = (interaction.options as CommandInteractionOptionResolver).getString('ratio');

        await ImageGenerate.generateDirect(
            {
                userId:interaction.user.id,
                channelId:interaction.channelId,
                key:process.env.ARTIVA_API!!,
                model:query,
                prompt:prm,
                negativePrompt:nprm,
                ratio:rto
            },
            interaction
        )

    }
})