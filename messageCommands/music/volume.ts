import { Message, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
import {client} from "../../app";

export default new MessageCommand({
	data: {
        name: "volume",
        duplicatedData:["볼륨","음량"],
        description: "볼륨을 설정합니다",
    },
	async execute(message:Message,args:string,content?:string) {
		const voiceChannel: VoiceBasedChannel | null = message.guild!!.members.cache.get(message.author.id)!!.voice.channel
        const query:string|undefined = content;
        if(!voiceChannel){
            message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(message.guildId!!)){
            message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            if(!query){
                const volume = queue.get(message.guildId!!)!!.volume();
                message.reply({embeds:[new EmbedBuilder().setColor(0xdbce39).setTitle(`:speaker: | 현재 볼륨 : ${volume}%`)]})
            } else {
                const queryInt = isNaN(parseInt(query)) ? false:parseInt(query);
                if(queryInt === false){
                    message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 숫자를 입력해 주세요")]});
                } else {
                    const volume = queue.get(message.guildId!!)!!.volume(queryInt);
                    message.reply({embeds:[new EmbedBuilder().setColor(0xdbce39).setTitle(`:speaker: | 볼륨이 ${volume}% 로 설정되었습니다`)]});
                    client.serverProperty.get(message.guildId!!)!!.player.volume = String(volume!!);
                }
                
            }

        }
	},
})