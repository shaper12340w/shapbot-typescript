import { Message, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { MessageCommand} from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
import { convertTimeToSeconds } from '../../modules/common/extras';
import { client } from '../../app';
import { Track } from 'shoukaku';

export default new MessageCommand({
    data: {
        name: "move",
        duplicatedData:["움직여","시간","부터"],
        description: "해당 동영상의 시간으로 이동합니다",
    },
	async execute(message:Message,args:string,content?:string){
		const voiceChannel: VoiceBasedChannel | null = message.guild!!.members.cache.get(message.author.id)!!.voice.channel
        if(!voiceChannel){
            message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(message.guildId!!)){
            message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            const optionValue = content!!;
            const nowplayingValue = (await (() => { 
                return new Promise<Track["info"]>(
                    (resolve:(result: Track["info"]) => void,
                    reject:(reason: unknown) => void) =>
                    {
                        client.shoukaku.getNode()!!.rest.decode(queue.get(message.guildId!!)!!.data.player!!.track!!)!!.then((e)=>resolve(<Track["info"]>JSON.parse(JSON.stringify(e!!)))).catch(e=>reject(e));
                    })
            })());
            
            if(!isNaN(Number(optionValue))){
                const secondsVal = parseInt(optionValue)*1000;
                if(secondsVal<0 || nowplayingValue.length < secondsVal){
                    message.reply(`\`\`\`\n현재 보낸 ${optionValue}초는 해당 곡의 길이\n${Math.round(nowplayingValue.length/1000)}초 보다 깁니다!\`\`\``)
                } else {
                    queue.get(message.guildId!!)!!.data.player!!.seekTo(secondsVal);
                    message.reply(`\`\`\`\n${optionValue}초로 이동 완료!\`\`\``)
                }
            } else {
                try{
                    const remakedVal = convertTimeToSeconds(optionValue);
                    if(remakedVal<0 || nowplayingValue.length < remakedVal){
                        message.reply(`\`\`\`\n현재 보낸 ${optionValue}는 해당 곡의 길이\n${Math.round(nowplayingValue.length/1000)}초 보다 깁니다!\`\`\``)
                    } else {
                        queue.get(message.guildId!!)!!.data.player!!.seekTo(remakedVal*1000);
                        message.reply(`\`\`\`\n${optionValue}로 이동 완료!\`\`\``)
                    }
                } catch(e:unknown){
                    message.reply(`\`\`\`\n형식이 옳지 않습니다\n예시: 3분 3초\`\`\``)
                }
                
            }
        }
    }
})