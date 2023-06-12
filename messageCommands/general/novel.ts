import { MessageCommand } from "../../structures/Command";
import { Message } from "discord.js";
import { ImageGenerate, modelList } from "../../modules/image/imageGenerate";

const reModelList:{name:string;value:string}[] = Object.keys(modelList).map(name=>{
    return { name: `${modelList[name].desc}`, value: name }
})
const reRatioList:{name:string;value:string}[] = [
    { name:"Square (1:1)", value:"square" },
    { name:"Portrait (2:3)", value:"portrait" },
    { name:"Landscape (3:2)", value:"landscape" }
];
export default new MessageCommand({
    data: {
        name: "novel",
        duplicatedData:["이미지","노벨","노블"],
        description: "이미지를 생성합니다",
    },
    async execute(message:Message,args:string,content?:string){
        const [query,prm,nprm,rto] = content!!.split("/")!!;

        const findQuery = reModelList.find((e)=>e.name.toLowerCase().includes(query));
        if(!findQuery) return await message.reply("모델을 찾을 수 없습니다");

        const reRto = rto ?? "landscape";
        const findRto = reRatioList.find((e)=>e.name.toLowerCase().includes(reRto));
        if(!findRto) return await message.reply("비율을 찾을 수 없습니다");

        await ImageGenerate.generateDirect(
            {
                userId:message.author.id,
                channelId:message.channelId,
                key:process.env.ARTIVA_API!!,
                model:findQuery.value,
                prompt:prm,
                negativePrompt:nprm,
                ratio:findRto.value
            },
            message
        )

    }
})