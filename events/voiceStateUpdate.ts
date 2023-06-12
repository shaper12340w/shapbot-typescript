import {Event} from '../structures/Event'
import {TextChannel, VoiceChannel, VoiceState} from "discord.js";
import {client} from '../app';
import {queue} from "../modules/lavalink/manageQueue";


export default new Event({
    name: "voiceStateUpdate",
    async run(oldState: VoiceState, newState: VoiceState) {
        const getMemberCount = (channelId: string) => (<VoiceChannel>client.channels.cache.get(channelId)!!).members.size;
        if (queue.has(newState.guild!!.id)) {

            if (!newState.channel) {
                if(getMemberCount(queue.get(newState.guild!!.id)!!.data.option.playRoom) === 1){
                    if(!queue.get(newState.guild!!.id)!!.data.player!!.paused) queue.get(newState.guild!!.id)!!.pause();
                    await (<TextChannel>client.channels.cache.get(queue.get(newState.guild!!.id)!!.data.option.sendRoom)!!)
                        .send({
                            embeds: [{
                                color: 0x1c7fe8,
                                title: "⏸️ | 음성방에 아무도 없어 일시정지됨",
                                footer: {text: "/pause를 통해 재생!"}
                            }]
                        });
                    queue.get(newState.guild!!.id)!!.data.timer = setTimeout(()=>{
                        (<TextChannel>client.channels.cache.get(queue.get(newState.guild!!.id)!!.data.option.sendRoom)!!)
                            .send({
                                embeds: [{
                                    color: 0x1c7fe8,
                                    title: "⏹️ | 30분동안 아무도 재생하지 않아 자동으로 정지되었습니다",
                                }]
                            });
                        if(queue.get(newState.guild!!.id)!!.data.killList) queue.get(newState.guild!!.id)!!.data.killList.forEach(e=>e())
                        queue.get(newState.guild!!.id)!!.stop()

                    },30*60*1000)
                }
            } else {
                if(newState.channel!!.members!!.size > 1 && newState.channel!!.members.has(client.user!!.id) && queue.get(newState.guild!!.id)!!.data.timer){
                    await (<TextChannel>client.channels.cache.get(queue.get(newState.guild!!.id)!!.data.option.sendRoom)!!)
                        .send({
                            embeds: [{
                                color: 0x1c7fe8,
                                title: "▶️ | 사람이 들어와서 자동재생됨",
                            }]
                        });
                    queue.get(newState.guild!!.id)!!.pause();
                    clearTimeout(queue.get(newState.guild!!.id)!!.data.timer);
                    queue.get(newState.guild!!.id)!!.data.timer = undefined;
                }
                if(oldState.channel)
                if (oldState.channel!!.id !== newState.channel!!.id && oldState.channel!!.id === queue.get(oldState.guild!!.id)!!.data.option.playRoom) {
                    await (<TextChannel>client.channels.cache.get(queue.get(newState.guild!!.id)!!.data.option.sendRoom)!!)
                        .send({
                            embeds: [{
                                color: 0xe01032,
                                title: "❗ | 임의로 방을 바꾸지 마세요",
                                footer: {text: "에러가 유발될 수 있어 자동중지됨"}
                            }]
                        });
                    queue.get(newState.guild!!.id)!!.stop();
                }
            }
        }
    }
})