import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder, CommandInteractionOptionResolver } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
import {client} from "../../app";

export default new Command({
	data: new SlashCommandBuilder()
		.setName('volume')
		.setDescription('재생중인 곡의 볼륨을 정합니다')
        .addStringOption(option =>
            option.setName('volume')
                .setDescription('볼륨(숫자만)')),
	async execute(interaction:CommandInteraction) {
		const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(interaction.user.id)!!.voice.channel
        const query:string|null = (interaction.options as CommandInteractionOptionResolver).getString('volume');
        if(!voiceChannel){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            if(!query){
                const volume = queue.get(interaction.guildId!!)!!.volume();
                interaction.reply({embeds:[new EmbedBuilder().setColor(0xdbce39).setTitle(`:speaker: | 현재 볼륨 : ${volume}%`)]})
            } else {
                const queryInt = isNaN(parseInt(query)) ? false:parseInt(query);
                if(queryInt === false){
                    interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 숫자를 입력해 주세요")]});
                } else {
                    const volume = queue.get(interaction.guildId!!)!!.volume(queryInt);
                    interaction.reply({embeds:[new EmbedBuilder().setColor(0xdbce39).setTitle(`:speaker: | 볼륨이 ${volume}% 로 설정되었습니다`)]})
                    client.serverProperty.get(interaction.guildId!!)!!.player.volume = String(volume!!);
                }
                
            }

        }
	},
})