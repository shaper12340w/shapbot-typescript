import { SlashCommandBuilder,CommandInteraction,CommandInteractionOptionResolver,VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command'
import { Queue, returnType } from '../../modules/lavalink/manageQueue';
import { queue } from '../../modules/lavalink/manageQueue';
import { makeEmbed } from '../../modules/common/manageEmbed';
import { Track } from 'shoukaku';

const numberList = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

async function selectMessage(searchResult: Track[], interaction: CommandInteraction):Promise<returnType|undefined> {
    let data:returnType|undefined;

    if(searchResult.length === 1){
        data = await queue.get(interaction.guildId!!)!!.play(searchResult!![0]);
        const embed = Object.assign({},data!!.embed!!)
        embed.footer.text = interaction.user.tag;
        embed.footer.icon_url = interaction.guild!!.members.cache.get(interaction.user.id)!!.displayAvatarURL()
        await interaction.editReply({ content:`${data!!.desc!! === "add" ? "\`추가되었습니다\`" : "\`신규 재생\`"}`,embeds:[embed]})
        return;
    } else {
        await interaction.editReply({embeds:[makeEmbed("곡을 선택해주세요",searchResult!!.map((e,i)=>{return numberList[i]+" | "+e.info.title}).join("\n")!!,"blue")!!.setFooter({text:'원하는 결과가 없을 경우 "취소"를 입력'})]})
        await interaction.channel!!.awaitMessages({
            filter: m => m.author.id === interaction.user.id,
            max: 1,
            time: 10000,
            errors: ["time"]
        }).then(async (response) => {
            const message = response.first()!!;
            const numMessage = parseInt(message.content.slice(0,1));
            if (message.content === "취소") {
                interaction.deleteReply();
                interaction.channel!!.send({ embeds: [makeEmbed("곡 선택이 취소되었습니다!", "취소됨", "yellow", 0)!!] })
                return;
            } 
            else if (numMessage > 0 && numMessage < 7) {
                interaction.deleteReply();
                message.delete();
                const num = numMessage - 1;
                data = await queue.get(interaction.guildId!!)!!.play(searchResult!![num])
                const embed = Object.assign({},data!!.embed!!)
                embed.footer.text = message.author.tag;
                embed.footer.icon_url = message.member!!.displayAvatarURL();
                interaction.channel!!.send({ content:`${data!!.desc!! === "add" ? "\`추가되었습니다\`" : "\`신규 재생\`"}`,embeds:[embed]})
            }
        })
        return data;
    }
}

export default new Command({
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('곡을 재생합니다!')
        .addStringOption(option =>
            option.setName('search_or_link')
                .setDescription('찾을 곡 이름 또는 링크')
                .setRequired(true)),
                
	async execute(interaction: CommandInteraction) {
        const voiceChannel: VoiceBasedChannel | null = interaction.guild!!.members.cache.get(interaction.user.id)!!.voice.channel
        const query: string = (interaction.options as CommandInteractionOptionResolver).getString('search_or_link')!!;
        await interaction.deferReply();
        if(!voiceChannel){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음성 채널에 입장해주세요")]});
            return;
        }
        if(!queue.get(interaction.guildId!!)){
            queue.set(interaction.guildId!!,new Queue(interaction.channelId!!,interaction.guild!!.id,voiceChannel.id));
            const searchResult = (await queue.get(interaction.guildId!!)!!.search(query))?.slice(0,6);
            await selectMessage(searchResult!!,interaction)
        } else {
            const searchResult = (await queue.get(interaction.guildId!!)!!.search(query))?.slice(0,6);
            await selectMessage(searchResult!!,interaction)

        }
	},
});