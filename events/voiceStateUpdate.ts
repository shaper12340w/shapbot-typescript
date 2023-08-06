import {Event} from '../structures/Event'
import {TextChannel, VoiceChannel, VoiceState} from "discord.js";
import {client} from '../app';
import {queue} from "../plugins/lavalink/manageQueue";


export default new Event({
    name: "voiceStateUpdate",
    async run(oldState: VoiceState, newState: VoiceState) {
        const getMember = (channelId: string) => (<VoiceChannel>client.channels.cache.get(channelId)!!);
        const getClient = await oldState.guild!!.members.fetch(client.user!!.id)!!
        const getMemberCount = (channelId: string) => getMember(channelId).members.size;

        if (getMember(oldState.channelId!!)) {
            if (queue.has(oldState.guild!!.id) && getMember(oldState.channelId!!).members.has(client.user!!.id)) {

                if (getMemberCount(oldState.channelId!!) === 1) {


                    if (!queue.get(newState.guild!!.id)!!.data.player!!.paused) queue.get(newState.guild!!.id)!!.pause();
                    await (<TextChannel>client.channels.cache.get(queue.get(newState.guild!!.id)!!.data.option.sendRoom)!!)
                        .send({
                            embeds: [{
                                color: 0x1c7fe8,
                                title: "⏸️ | 음성방에 아무도 없어 일시정지됨",
                                footer: {text: "/pause를 통해 재생!"}
                            }]
                        });
                    queue.get(newState.guild!!.id)!!.data.timer = setTimeout(() => {
                        (<TextChannel>client.channels.cache.get(queue.get(newState.guild!!.id)!!.data.option.sendRoom)!!)
                            .send({
                                embeds: [{
                                    color: 0x1c7fe8,
                                    title: "⏹️ | 30분동안 아무도 재생하지 않아 자동으로 정지되었습니다",
                                }]
                            });
                        if (queue.get(newState.guild!!.id)!!.data.killList) queue.get(newState.guild!!.id)!!.data.killList.forEach(e => e())
                        queue.get(newState.guild!!.id)!!.stop()

                    }, 30 * 60 * 1000)

                }

            }
        } else {
            if(queue.has(oldState.guild!!.id))
            if (queue.get(newState.guild!!.id)!!.data.timer) {
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
        }
    }
})