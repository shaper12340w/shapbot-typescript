import {
    VoiceBasedChannel,
    EmbedBuilder,
    MessageReplyOptions,
    Message,
    APIEmbed
} from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { Queue, returnType } from '../../modules/lavalink/manageQueue';
import { queue } from '../../modules/lavalink/manageQueue';
import { makeEmbed } from '../../modules/discord/manageEmbed';
import { Track } from 'shoukaku';

const numberList = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

interface ReturnEmbedData extends MessageReplyOptions { content:string; embeds:APIEmbed[] };

async function selectMessage(searchResult: Track[], message:Message):Promise<void> {

    async function sendAddMessage(index:number):Promise<ReturnEmbedData>{
        const data = await queue.get(message.guildId!!)!!.play(searchResult!![index]);
        const embed = Object.assign({},data!!.embed!!);
        embed.footer!!.text = message.author.tag;
        embed.footer!!.icon_url = message.member!!.displayAvatarURL();
        return <ReturnEmbedData>{ content:`${data!!.desc!! === "add" ? "\`추가되었습니다\`" : "\`신규 재생\`"}`,embeds:[embed]}
    }
    if(!searchResult){
        await message.reply({embeds:[makeEmbed("검색 결과가 없습니다",`${message.content}`,"yellow",":grey_exclamation:")]})
        return;
    }
    if(searchResult.length === 1){
        const result = await sendAddMessage(0);
        await message.reply(result);
        return;
    } else if(searchResult.length > 1){
        const sendMessage = await message.reply({embeds:[makeEmbed("곡을 선택해주세요",searchResult!!.map((e,i)=>{return numberList[i]+" | "+e.info.title}).join("\n")!!,"blue")!!.setFooter({text:'원하는 결과가 없을 경우 "취소"를 입력'})]})
        await message.channel!!.awaitMessages({
            filter: m => m.author.id === message.author.id,
            max: 1,
            time: 10000,
            errors: ["time"]
        })
        .then(async (response) => {
            const message = response.first()!!;
            const numMessage = parseInt(message.content.slice(0,1));
            if (message.content === "취소") {
                await sendMessage.delete();
                message.channel!!.send({ embeds: [makeEmbed("곡 선택이 취소되었습니다!", "취소됨", "yellow", 0)!!] })
                return;
            } 
            else if (numMessage > 0 && numMessage < 7) {
                await sendMessage.delete();
                message.delete();
                const result = await sendAddMessage(numMessage - 1);
                message.channel!!.send(result);
            }
        })
        .catch(async (err:unknown)=>{
            const result = await sendAddMessage(0);
            await message.reply({ embeds: [makeEmbed("선택하지 않아 자동으로 1번이 선택되었습니다","`"+result.embeds[0].title+"`","yellow",":grey_exclamation:")]})
            message.channel!!.send(result);
        })
    }
}

export default new MessageCommand({
    data: {
        name: "play",
        duplicatedData:["재생","노래","틀어줘"],
        description: "곡을 재생합니다",
    },
                
	async execute(message:Message,args:string,options?:string) {
        const voiceChannel: VoiceBasedChannel | null = message.guild!!.members.cache.get(message.author.id)!!.voice.channel
        const query: string = options!!;
        if(!voiceChannel){
            await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(message.guildId!!)){
            queue.set(message.guildId!!,new Queue(message.channelId!!,message.guild!!.id,voiceChannel.id));
            const searchResult = (await queue.get(message.guildId!!)!!.search(query))?.slice(0,6);
            await selectMessage(searchResult!!,message)
        } else {
            const searchResult = (await queue.get(message.guildId!!)!!.search(query))?.slice(0,6);
            await selectMessage(searchResult!!,message)
        }
	},
});