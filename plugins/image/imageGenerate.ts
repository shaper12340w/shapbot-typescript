import {client} from "../../app";
import {
    ButtonStyle,
    CommandInteraction,
    EmbedBuilder,
    EmbedFooterOptions,
    Message,
    MessageEditOptions,
    TextChannel
} from "discord.js"
import {ImageNSFWCheck} from "./imageNSFWDetect";
import {predictionType} from "nsfwjs";
import {Logger} from "../common/logger";
import {Artiva} from "./Artiva";
import {ArtivaModel, AspectRatio, JobStatus, Sampler} from "./types/GeneralTypes"
import {UpscaleType} from "./types/ImageUpscaleTypes"
import {CreateGenerationRequest, GenerationResponse} from "./types/GenerationTypes";
import {createButtonSet} from "../discord/interactions";
import {ImageToImageRequest} from "./types/ImageToImageTypes";

export interface GenerateType{
    model:ArtivaModel; //model
    prompt:string; //prompt
    imageUrl?:string; //image_url
    negativePrompt?:string|null; //negative_prompt
    ratio?:AspectRatio; //aspect_ratio
    seed?:number; //seed
    scheduler?:Sampler | `${Sampler}_karras`; // scheduler + karras
    step?:number & { __lt50: true }; //step
    creativity?:boolean; //clip_skip
    similarity?:number& { __lt100: true }; //cfg_scale
    upscale?:UpscaleType // (use upscale model)
}

export interface GenerationReturn extends GenerationResponse{
    upscaled?:JobStatus;
    nsfw?:number;
}

export interface GenerateServerType{
    userId:string;
    channelId:string;
    messageId?:string;
    time?:number;
}

type RequestData<T extends boolean> = T extends true ? ImageToImageRequest : CreateGenerationRequest;

export class ImageGenerate{

    public static queue:Map<string,GenerateType&GenerateServerType> = new Map();
    public static async generateDirect(data:GenerateType&GenerateServerType,interaction:CommandInteraction|Message){
        if(this.queue.has(data.userId)) return interaction.reply({embeds:[
                new EmbedBuilder()
                    .setTitle("❌ | 이미 요청하셨습니다")
                    .setColor(0xf15152)
            ]})
        this.checkQueue();
        data.time = new Date().getTime();
        this.queue.set(data.userId,data);

        const repliedMessage = await interaction.reply({embeds:[
                new EmbedBuilder()
                    .setTitle(`${client.users.cache.get(data.userId)!!.username} 님의 사진이 요청되었습니다`)
                    .setDescription(`잠시만 기다려 주세요`)
                    .setColor(0x08bf9b)
            ],fetchReply:true
        });
        const getChannel:TextChannel = client.channels.cache.get(data.channelId)!! as TextChannel;
        try {
            const artiva = new Artiva(process.env.ARTIVA_API!!);
            const requestData: RequestData<true|false> = {
                model: data.model,
                prompt: data.prompt,
                steps: data.step || 20,
                ...(data.imageUrl && {image: data.imageUrl}),
                ...(data.negativePrompt && {negative_prompt: data.negativePrompt}),
                ...(data.seed && {seed: data.seed}),
                ...(data.ratio && {aspect_ratio: data.ratio}),
                ...(data.scheduler && {scheduler: data.scheduler.replace("_karras",'') as Sampler}),
                ...(data.scheduler && {karras: data.scheduler.endsWith("_karras")}),
                ...(data.creativity && {clip_skip: data.creativity}),
                ...(data.similarity && {cfg_scale: parseFloat((data.similarity/4).toFixed(1))})
            };
            Logger.debug(requestData);
            function getResult(requestData:RequestData<boolean>):Promise<GenerationResponse>{
                if(data.imageUrl!!)
                    return artiva.generateImage2Image(requestData as ImageToImageRequest)
                else
                    return artiva.generateText2Image(requestData)
            }
            getResult(requestData)
                .then(async (result: GenerationReturn) => {
                    //debug
                    Logger.info(`[ IMAGE GENERATED ]\nSTATUS : ${result.status}\nPROMPT : ${result.params ? result.params.prompt : undefined}\nMODEL : ${result.params ? result.params.model : undefined}\nJOB : ${result.id}\nURL : ${result.imgUrl}`)
                    Logger.debug(result)
                    //when succeeded
                    if (result.status == "succeeded") {
                        if(data.upscale){
                            artiva.imageUpscale(result.id,data.upscale)
                                .then(e=>result.upscaled = e.status)
                                .catch(e=>result.upscaled = JobStatus.ERROR)
                        }
                        const keyData: GenerateServerType = {
                            userId: data.userId,
                            channelId: data.channelId,
                            messageId: repliedMessage.id
                        };
                        this.queue.delete(data.userId);
                        this.sendMessage(result, keyData);
                    }
                    //when failed
                    else if (result.status == "error") {
                        getChannel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("❌ | 처리 과정에서 에러가 발생했습니다")
                                    .setDescription(`해당 이미지 아이디 : ${result.id}`)
                                    .setColor(0xf15152)
                            ]
                        })
                        this.queue.delete(data.userId);
                    }
                })
                .catch((err: Error) => {
                    getChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("❌ | 이미지 생성에 실패했습니다")
                                .setDescription(`\`\`\`${err}\`\`\``)
                                .setColor(0xf15152)
                        ]
                    })
                    this.queue.delete(data.userId);
                    Logger.error(err.stack);
                })
        } catch (e) {
            getChannel.send({embeds:[
                    new EmbedBuilder()
                        .setTitle("❌ | 이미지 생성에 실패했습니다")
                        .setDescription(`\`\`\`${e}\`\`\``)
                        .setColor(0xf15152)
                ]})
                this.queue.delete(data.userId);
                Logger.error(e);
        }
    }

    private static async sendMessage(imageData: GenerationReturn, serverData: GenerateServerType) {
        const getChannel = client.channels.cache.get(serverData.channelId)!! as TextChannel;
        const getMessage = getChannel.messages.cache.get(serverData.messageId!!)!!;
        try {
            await getMessage.edit({embeds: [new EmbedBuilder().setTitle(":thinking: | 이미지의 nsfw 여부를 검사하고 있습니다").setColor(0xd5e128).setDescription("잠시만 기다려 주세요 (예상 시간: 3초)")]})
            const nsfwjsCheck = await this.filterImageNsfwjs(imageData.imgUrl!!); imageData.nsfw = nsfwjsCheck;
            const detailDataButton = (data:GenerationReturn) =>  createButtonSet(getMessage.id,[{
                label:"자세한 정보",
                style:ButtonStyle.Secondary,
                execute({ interaction}){
                    interaction.reply({
                        embeds:[new EmbedBuilder().setColor(0xd5e128)
                            .setDescription(`## 요청 정보\n - | 이미지 ID | ${data.id}\n - | 생성 상태 | ${data.status}\n- | 생성 모델 | ${data.params!!.model}\n## 이미지 정보\n - | 프롬프트 | ${data.params!!.prompt}\n - | 생성 단계 | ${data.params!!.step}\n - | 시드 | ${data.params!!.seed}\n - | 프롬프트 유사성 | ${data.params!!.cfg}\n - | 창의적 생성 | ${data.params!!.clip_skip}\n - | 셈플러 | ${data.params!!.scheduler}\n - | 비율 | ${data.params!!.aspect_ratio}\n - | 업스케일링 | ${data.upscaled ?? false}\n - | NSFW | ${data.nsfw}\n## 링크\n - | 이미지 링크 | ${data.imgUrl}\n - | 미리보기 이미지 링크 | ${data.ogUrl}`)
                        ],
                        ephemeral:true
                    })
                }
            }])
            const editedData:MessageEditOptions = {embeds: [this.makeEmbed(nsfwjsCheck, imageData, serverData)],components:[detailDataButton(imageData)]};
            Logger.debug(`NSFWJS : ${(nsfwjsCheck * 100).toFixed(1)}`)
            if (nsfwjsCheck > 0.5) {
                if (getChannel.nsfw) {
                    await getMessage.edit(editedData);
                } else {
                    await getMessage.edit({embeds: [new EmbedBuilder().setTitle("❌ | nsfw 이므로 검열되었습니다").setColor(0xf15152).setDescription(`NSFW : ${(nsfwjsCheck * 100).toFixed(1)}%`)]});
                }
            } else {
                await getMessage.edit(editedData);

            }
        } catch(e:unknown){
            await getChannel.send({embeds:[
                    new EmbedBuilder()
                        .setTitle("❌ | 이미지 생성에 실패했습니다")
                        .setDescription(`\`\`\`${e}\`\`\``)
                        .setColor(0xf15152)
                ]})
            console.log(e);
        }


    }
    private static makeEmbed(nsfwNumber:number,imageData:GenerationResponse,serverData:GenerateServerType){
        const [red,green] = [0xf15152,0x08bf9b];
        return new EmbedBuilder()
            .setColor(nsfwNumber > 0.5 ? red:green)
            .setTitle(`${client.users.cache.get(serverData.userId)!!.username}님의 사진`)
            .addFields(
                { name:"모델명", value:imageData.params!!.model, inline:true},
                { name:"NSFW", value:`${(nsfwNumber*100).toFixed(1)}%`, inline:true},
                { name:"링크", value:`[정보](https://artiva.kr/exif/${imageData.id}), [다운로드](${imageData.imgUrl!!.replace(/\/static\//,"/download/")})`, inline:true }
            )
            .setImage(imageData.imgUrl!!)
            .setFooter(<EmbedFooterOptions>{text:"powered by weLim"})
            .setTimestamp()
    }

    private static checkQueue(){
        this.queue.forEach(e=>{
            if((new Date().getTime() - e.time!!) > 300000){
                this.queue.delete(e.userId)
            }
        })
    }
    private static async filterImageNsfwjs(url:string){
        const nsfwjsCheck:number = (await ImageNSFWCheck.checkNSFW(url))!!.reduce((acc:number,cur:predictionType)=>{
            if(!['Drawing','Neutral'].includes(cur.className)){
                return acc + cur.probability;
            }
            return acc;
        },0);
        return nsfwjsCheck;
    }
}