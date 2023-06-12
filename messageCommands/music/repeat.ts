import { Message, EmbedBuilder } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { queue } from '../../modules/lavalink/manageQueue';
import { createButtonSet } from '../../modules/discord/interactions';

type button = () => void;
const Buttons:button[] = [];

export default new MessageCommand({
    data: {
        name: "repeat",
        duplicatedData:["반복","셔플"],
        description: "음악 반복 기능을 설정합니다",
    },
    async execute(message:Message) {
        if(!queue.get(message.guildId!!)){
            await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            Buttons.forEach(e=>{try{e()}catch(e:unknown){}});
            const status = ['반복 안함','전체 반복','한 곡만'];
            const status2 = ['일반 재생',"셔플"]
            const emojiList = ['▶️','🔁','🔂'];
            const shuffle  = ['▶️',"🔀"];
            const buttonSet = createButtonSet(message.id,[
                {
                    label: status[queue.get(message.guildId!!)!!.data.option.playRepeat],
                    emoji:emojiList[queue.get(message.guildId!!)!!.data.option.playRepeat],
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
                    label: status2[queue.get(message.guildId!!)!!.data.option.playShuffle],
                    emoji:shuffle[queue.get(message.guildId!!)!!.data.option.playShuffle],
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
            await message.reply({components:[buttonSet]});
        }

    }
})