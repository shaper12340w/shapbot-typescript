import axios, { AxiosRequestConfig } from 'axios';
import { client } from "../../app";
import { TextChannel, EmbedBuilder, EmbedFooterOptions, CommandInteraction, Message } from "discord.js"
import { ImageNSFWCheck } from "./imageNSFWDetect";
import { predictionType } from "nsfwjs";

/*
const dataSample = {
    "status": "succeeded",
    "job": "5a462909-8469-4e92-a849-ef22c00dc6ca",
    "prompt": "a white cat",
    "model": "StableDiffusion v2.1",
    "aspect_ratio": "square",
    "imgUrl": "https://static.molya.kr/static/6bea3f12278a421084a4edbcc5d3e514.webp",
    "title": "",
    "desc": "",
    "gpu": "NVIDIA GeForce RTX 3070",
    "negative_prompt": "(Greyscale:1.7), faded,bad face, (Low Quality, Worst Quality, Lowres:1.4), (Blurry, Blurry Background, Depth of Field, Bokeh, DOF, Fog, Bloom:1.4), (Blush:1.5), poorly Rendered face, poor facial details, poorly drawn hands, poorly rendered hands, low resolution, Images cut out at the top, left, right, bottom, bad composition, mutated body parts, blurry image, disfigured, oversaturated, bad anatomy, deformed body features, out of frame, lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature",
    "ogUrl": "https://i.molya.kr/i/Lu4G1e"
}

*/
interface ModelListType{
    [key:string]:{
        desc:string;
        type:string;
    }
}
export const modelList:ModelListType = {
    "Midjourney": {
        "desc": "Midjourney (미드저니)",
        "type": "normal,landscape,portrait"
    },
    "AnythingV4.5": {
        "desc": "Anything 4.5 (애니띵 4.5V)",
        "type": "anime"
    },
    "AnythingV5.0": {
        "desc": "Anything 5.0 (애니띵 5.0V)",
        "type": "anime"
    },
    "StableDiffusion": {
        "desc": "Stable Diffusion (스태이블 디퓨전)",
        "type": "normal"
    },
    "AbsoluteReality": {
        "desc": "Absolute Reality (앱솔루트 리얼리티)",
        "type": "normal"
    },
    "MeinaMix": {
        "desc": "MeinaMix (미나믹스)",
        "type": "anime"
    },
    "Realisticvision": {
        "desc": "Realistic Vision (리얼리스틱 비전)",
        "type": "landscape,realism"
    },
    "Lyriel": {
        "desc": "Lyriel (라이렐)",
        "type": "realism like anime"
    },
    "DreamlikeDiffusion": {
        "desc": "DreamLike Diffusion (드림라익 디퓨전)",
        "type": "normal like anime"
    },
    "DreamSharper": {
        "desc": "DreamSharper (드림샤퍼)",
        "type": "realism like anime"
    },
    "RevAnimated": {
        "desc": "Revanimated (래브애니매이티드)",
        "type": "realism like anime"
    },
    "AbyssOrangeMix2": {
        "desc": "Abyss Orangemix V2 (어비스 오렌지믹스 V2)",
        "type": "anime"
    },
    "AbyssOrangeMix3": {
        "desc": "Abyss Orangemix V3 (어비스 오렌지믹스 V3)",
        "type": "anime"
    },
    "CamelliaMix": {
        "desc": "CamelliaMix (카멜리아믹스)",
        "type": "realism like anime"
    },
    "HenmixRealV40": {
        "desc": "HenmixReal (핸믹스리얼)",
        "type": "realism,landscape,portrait"
    }
};

export interface ImageRequestDataType{
    status:string;
    job:string;
    prompt?:string;
    model?:string;
    aspect_ratio?:string;
    imgUrl?:string;
    title?:string;
    desc?:string;
    gpu?:string;
    negative_prompt?:string;
    ogUrl?:string;
}

export interface GenerateType{
    key:string;
    model:string;
    prompt:string;
    negativePrompt?:string|null;
    ratio?:string|null;
}

export interface GenerateServerType{
    userId:string;
    channelId:string;
    messageId?:string;
    time?:number;
}

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

        type paramType = {[key:string]:string|boolean};
        const getChannel = client.channels.cache.get(data.channelId)!! as TextChannel;
        const mainURL:string = `https://artiva.kr/api/img/create`;
        const param:paramType = {
            apiKey:data.key,
            model:data.model,
            prompt:data.prompt,
            aspect_ratio:data.ratio ?? "landscape",
            direct:true
        }
        if(data.negativePrompt) param.negative_prompt = data.negativePrompt;
        return axios.get(mainURL,{
            params:param,
            timeout:300000
        })
            .then((result) => {
                if(result.data.status == "succeeded"){
                    const parsedData:ImageRequestDataType = <ImageRequestDataType>result.data;
                    const keyData:GenerateServerType = { userId:data.userId , channelId:data.channelId, messageId:repliedMessage.id };
                    this.queue.delete(data.userId);
                    this.sendMessage(parsedData,keyData);
                }
                else if(result.data.status == "censored"){
                    getChannel.send({embeds:[
                    new EmbedBuilder()
                        .setTitle("❌ | 프롬프트가 검열되었습니다")
                        .setDescription(`\`\`\`해당 프롬프트:${result.data.prompt}\`\`\``)
                        .setColor(0xf15152)
                ]})
                this.queue.delete(data.userId);
                }
            })
            .catch((err) => {
                getChannel.send({embeds:[
                    new EmbedBuilder()
                        .setTitle("❌ | 이미지 생성에 실패했습니다")
                        .setDescription(`\`\`\`${err}\`\`\``)
                        .setColor(0xf15152)
                ]})
                this.queue.delete(data.userId);
                console.log(err);
            })
    }
    public static async generate(data:GenerateType&GenerateServerType,interaction:CommandInteraction|Message){

        if(this.queue.has(data.userId)){
            interaction.reply({embeds:[
                    new EmbedBuilder()
                        .setTitle("❌ | 이미 요청하셨습니다")
                        .setColor(0xf15152)
                ]})
        } else {
            if(this.queue.size > 0){
                const sendMessage = await interaction.reply({embeds:[
                        new EmbedBuilder()
                            .setTitle(`${client.users.cache.get(data.userId)!!.username} 님의 사진이 요청되었습니다`)
                            .setDescription(`현재 ${this.queue.size}번째로 예약되었습니다\n사용자가 많을수록 지연될 수 있습니다`)
                            .setColor(0x08bf9b)
                    ],fetchReply:true});
                data.messageId = sendMessage.id;
                this.queue.set(data.userId,data);
            } else {
                const sendMessage = await interaction.reply({embeds:[
                        new EmbedBuilder()
                            .setTitle(`${client.users.cache.get(data.userId)!!.username} 님의 사진이 요청되었습니다`)
                            .setDescription("잠시만 기다려 주세요")
                            .setColor(0x08bf9b)
                    ],fetchReply:true});
                data.messageId = sendMessage.id;
                this.queue.set(data.userId,data);
                await this.requestImage(data);
            }
        }
    }
    private static async sendMessage(imageData:ImageRequestDataType,serverData:GenerateServerType){
        const getChannel = client.channels.cache.get(serverData.channelId)!! as TextChannel;
        const getMessage = getChannel.messages.cache.get(serverData.messageId!!)!!;
        try{
            if(imageData.status === "error"){
                getMessage.edit(`\`\`처리 도중 에러가 발생하였습니다\n\n${JSON.stringify(imageData,null,3)}\`\``);
            } else {
                const nsfwCheck = parseFloat(await this.filterImage(imageData.job));
                const nsfwjsCheck = await this.filterImageNsfwjs(imageData.imgUrl!!);
                console.log(`KAKAO NSFW : ${(nsfwCheck*100).toFixed(1)}\nNSFWJS : ${(nsfwjsCheck*100).toFixed(1)}`)

                if(nsfwjsCheck > 0.5){
                    if(getChannel.nsfw){
                        getMessage.edit({embeds:[this.makeEmbed(nsfwjsCheck,imageData,serverData)]});
                    } else {
                        getMessage.edit({embeds:[new EmbedBuilder().setTitle("❌ | nsfw 이므로 검열되었습니다").setColor(0xf15152).setDescription(`NSFW : ${(nsfwjsCheck*100).toFixed(1)}%`)]});
                    }
                } else {
                    getMessage.edit({embeds:[this.makeEmbed(nsfwjsCheck,imageData,serverData)]});
                }

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
    private static async requestImage(data:GenerateType&GenerateServerType){
        type paramType = {[key:string]:string|boolean};
        const getChannel = client.channels.cache.get(data.channelId)!! as TextChannel;
        const mainURL:string = `https://artiva.kr/api/img/create`;
        const param:paramType = {
            apiKey:data.key,
            model:data.model,
            prompt:data.prompt,
            aspect_ratio:data.ratio ?? "landscape",
            direct:true
        }
        if(data.negativePrompt) param.negative_prompt = data.negativePrompt;
        return axios.get(mainURL,{
            params:param
        })
            .then((result) => {
                const parsedData:ImageRequestDataType = <ImageRequestDataType>result.data;
                const keyData:GenerateServerType = { userId:data.userId , channelId:data.channelId, messageId:data.messageId };
                this.sendMessage(parsedData,keyData);
                this.queue.delete(data.userId);
                if(this.queue.size > 0) this.requestImage(this.queue.values().next().value)
            })
            .catch((e:unknown)=>{
                console.error(e);
                getChannel.send(`\`\`처리 도중 에러가 발생하였습니다\`\``);
                this.queue.delete(this.queue.keys().next().value);
            });
    }
    private static makeEmbed(nsfwNumber:number,imageData:ImageRequestDataType,serverData:GenerateServerType){
        const [red,green] = [0xf15152,0x08bf9b];
        return new EmbedBuilder()
            .setColor(nsfwNumber > 0.5 ? red:green)
            .setTitle(`${client.users.cache.get(serverData.userId)!!.username}님의 사진`)
            .addFields(
                { name:"모델명", value:imageData.model!!, inline:true},
                { name:"NSFW", value:`${(nsfwNumber*100).toFixed(1)}%`, inline:true},
                { name:"링크", value:`[정보](https://artiva.kr/exif/${imageData.job}), [다운로드](${imageData.imgUrl!!.replace(/\/static\//,"/download/")})`, inline:true }
            )
            .setImage(imageData.imgUrl!!)
            .setFooter(<EmbedFooterOptions>{text:"powered by weLim"})
            .setTimestamp()
    }

    private static checkQueue(){
        this.queue.forEach(e=>{
            if((e.time!! - new Date().getTime()) > 60000){
                this.queue.delete(e.userId)
            }
        })
    }
    private static async filterImage(id:string){
        const imgUrl:string = `https://artiva.kr/api/img/filter/${id}`;
        return axios.get(imgUrl)
            .then(result=>{
                return result.data.nsfw
            })
            .catch(console.error)
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