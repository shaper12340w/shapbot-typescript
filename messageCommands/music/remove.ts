import {  EmbedBuilder, APISelectMenuOption, Message } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { playlistOption, queue } from '../../modules/lavalink/manageQueue';
import { createStringSelectMenuBuilder } from '../../modules/discord/interactions';

export default new MessageCommand({
	data: {
        name: "remove",
        duplicatedData:["제거","삭제"],
        description: "재생목록에서 곡을 제거합니다",
    },
	async execute(message:Message) {
        if(!queue.get(message.guildId!!)){
            await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            let sendMessage:Message|undefined;
            const playlist = queue.get(message.guildId!!)!!.data.playList
            const playlistLeft = playlist.filter(e=>e.status !== 2);
            if(playlist.length <= 1){
                await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 남은 곡이 1개 이하입니다!")]});
            } else {
                const musiclist = createStringSelectMenuBuilder({
                    id:"musiclist",
                    placeholder:"재생할 곡을 골라주세요",
                    options: new Array(playlistLeft.length).fill(null).map((_, i) => {
                        return <APISelectMenuOption>{ label: playlistLeft[i].name, value: String(i) }
                    }),
                    async execute({ interaction }){
                        const index = Number(interaction.values[0]);
                        const reducedNumbers = queue.get(interaction.guildId!!)!!.data.playList.reduce((acc, num) => {
                            const name = playlist.filter(e => e.status !== 2)[index];
                            if (JSON.stringify(num) !== JSON.stringify(name)) {
                                acc.push(num);
                            }
                            return acc;
                        }, <playlistOption[]>[]);
                        queue.get(interaction.guildId!!)!!.data.playList = reducedNumbers;
                        await interaction.channel!!.send("해당 곡이 전체 재생목록에서 제거되었습니다")
                        sendMessage!!.delete();
                    }
                })
                sendMessage = await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(`재거할 곡을 골라주세요`).setDescription(`**[전체목록]**\n${playlistLeft.map(e=>"`"+(e.status === 1 ? "🟩":"🟥")+"` "+e.name).join("\n")}`).setFooter({text:"🟩은 대기중인 곡, 🟥은 이미 재생된 곡"})], components:[musiclist] })
            }
            
        }

    }
})