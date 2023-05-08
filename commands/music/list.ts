import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder, APISelectMenuOption, Message } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
import { createStringSelectMenuBuilder } from '../../modules/common/interactions';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('곡 목록'),
	async execute(interaction:CommandInteraction) {
        
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            let sendMessage:Message|undefined
            const playlist = queue.get(interaction.guildId!!)!!.data.playList
            const nowPlaying = playlist.filter(e=>e.status === 2)[0];
            const toplay = playlist.filter(e=>e.status === 1);
            if(toplay.length === 0){
                interaction.reply({embeds:[new EmbedBuilder().setColor(0xdbce39).setTitle(`${interaction.guild!!.name}의 재생목록`).setDescription(`**[현재 재생중]**\n▶️ | ${nowPlaying.name}`)]});
            } else {
                const musiclist = createStringSelectMenuBuilder({
                    id:"musiclist",
                    placeholder:"재생할 곡을 골라주세요",
                    options: new Array(toplay.length).fill(null).map((_, i) => {
                        return <APISelectMenuOption>{ label: toplay[i].name, value: String(i) }
                    }),
                    async execute({ interaction }){
                        const index = Number(interaction.values[0]);
                        queue.get(interaction.guildId!!)!!.data.option.playNextOption = false;
                        queue.get(interaction.guildId!!)!!.data.playList.filter(e=>e.status === 1)[index].status = 3;
                        queue.get(interaction.guildId!!)!!.data.playList.filter(e=>e.status === 2)[0].status = 0;
                        queue.get(interaction.guildId!!)!!.data.playList.filter(e=>e.status === 3)[0].status = 2;
                        const playdata = queue.get(interaction.guildId!!)!!.data.playList.filter(e=>e.status === 2)[0];
                        queue.get(interaction.guildId!!)!!.data.player?.stopTrack()
                        queue.get(interaction.guildId!!)!!.data.player?.playTrack({ track:playdata.track })
                        queue.get(interaction.guildId!!)!!.data.option.playNextOption = true;
                        interaction.channel!!.send({embeds:[playdata.embed]}).catch();
                        sendMessage!!.delete().catch();;
                    }
                })
                sendMessage = await interaction.reply({embeds:[new EmbedBuilder().setColor(0xdbce39).setTitle(`${interaction.guild!!.name}의 재생목록`).setDescription(`**[현재 재생중]**\n▶️ | ${nowPlaying.name}\n\n**[재생목록]**\n${toplay.map((e,i)=>"`"+String(i+1)+"` | "+e.name).join("\n")}`)], components:[musiclist], fetchReply:true }).catch();
            }
            
        }

    }
})