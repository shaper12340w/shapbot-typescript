import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder, APISelectMenuOption, Message } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
import { createStringSelectMenuBuilder } from '../../modules/common/interactions';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('곡 목록'),
	async execute(interaction:CommandInteraction) {
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            let sendMessage:Message|undefined
            const playlist = queue.get(interaction.guildId!!)!!.data.playList
            const playlistLeft = playlist.filter(e=>e.status !== 2);
            if(playlist.length <= 1){
                interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 남은 곡이 1개 이하입니다!")]});
            } else {
                const musiclist = createStringSelectMenuBuilder({
                    id:"musiclist",
                    placeholder:"재생할 곡을 골라주세요",
                    options: new Array(playlistLeft.length).fill(null).map((_, i) => {
                        return <APISelectMenuOption>{ label: playlistLeft[i].name, value: String(i) }
                    }),
                    async execute({ interaction }){
                        const index = Number(interaction.values[0]);
                        delete queue.get(interaction.guildId!!)!!.data.playList.filter(e=>e.status !== 2)[index];
                        interaction.channel!!.send("해당 곡이 전체 재생목록에서 제거되었습니다")
                        sendMessage!!.delete();
                    }
                })
                sendMessage = await interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(`재거할 곡을 골라주세요`).setDescription(`**[전체목록]**\n${playlistLeft.map(e=>"`"+(e.status === 1 ? ":green_square:":":red_square:")+"` "+e.name).join("\n")}`).setFooter({text:":green_square:은 대기중인 곡, :red_square:은 이미 재생된 곡"})], components:[musiclist], fetchReply:true })
            }
            
        }

    }
})