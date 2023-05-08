import { SlashCommandBuilder,CommandInteraction, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
import { createButtonSet } from '../../modules/common/interactions';

type button = () => void;
const Buttons:button[] = [];

export default new Command({
    data: new SlashCommandBuilder()
        .setName('repeat')
        .setDescription('곡 반복을 설정합니다'),
    async execute(interaction:CommandInteraction) {
        if(!queue.get(interaction.guildId!!)){
            interaction.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            Buttons.forEach(e=>e())
            const status = ['반복 안함','전체 반복','한 곡만'];
            const status2 = ['일반 재생',"셔플"]
            const emojiList = ['▶️','🔁','🔂'];
            const shuffle  = ['▶️',"🔀"];
            const buttonSet = createButtonSet(interaction.id,[
                {
                    label: status[queue.get(interaction.guildId!!)!!.data.option.playRepeat],
                    emoji:emojiList[queue.get(interaction.guildId!!)!!.data.option.playRepeat],
                    style: 1,
                    async execute({ interaction, edit, kill }) {
                        if (!queue.get(interaction.guildId!!)) return;
                        Buttons.push(kill);
                        queue.get(interaction.guildId!!)!!.data.option.playRepeat++;
                        if(queue.get(interaction.guildId!!)!!.data.option.playRepeat > 2) queue.get(interaction.guildId!!)!!.data.option.playRepeat = 0;
                        await interaction.update({ components: [edit({label:status[queue.get(interaction.guildId!!)!!.data.option.playRepeat],emoji:emojiList[queue.get(interaction.guildId!!)!!.data.option.playRepeat]},{})], fetchReply: true });
                    }
                },
                {
                    label: status2[queue.get(interaction.guildId!!)!!.data.option.playShuffle],
                    emoji:shuffle[queue.get(interaction.guildId!!)!!.data.option.playShuffle],
                    style: 1,
                    async execute({ interaction, edit, kill }) {
                        if (!queue.get(interaction.guildId!!)!!) return;
                        Buttons.push(kill);
                        queue.get(interaction.guildId!!)!!.data.option.playShuffle++;
                        if(queue.get(interaction.guildId!!)!!.data.option.playShuffle > 1) queue.get(interaction.guildId!!)!!.data.option.playShuffle = 0;
                        await interaction.update({ components: [edit({},{label:status2[queue.get(interaction.guildId!!)!!.data.option.playShuffle],emoji:shuffle[queue.get(interaction.guildId!!)!!.data.option.playShuffle]})], fetchReply: true });
                    }
                },
            ])
            interaction.reply({components:[buttonSet]});
        }

    }
})