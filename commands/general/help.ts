import {SlashCommandBuilder, CommandInteraction, AttachmentBuilder, APIEmbed, EmbedBuilder} from 'discord.js';
import {Command} from '../../structures/Command'

interface commandListData {
    name: string;
    description?: string;
    commands: string[];
}

export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('help')
            .setDescription('도움말'),
        async execute(interaction: CommandInteraction) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("도움말")
                        .setDescription("http://shaper.kro.kr")
                ]
            })
        }
    },
    message: {
        data: {
            name: "help",
            description: "도움말",
            duplicatedData: ["도움", "도움말", "help", "도움말", "명령어", "명령어"],
        },
        async execute(message) {
            await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("도움말")
                        .setDescription("http://shaper.kro.kr")
                ]
            })
        }
    }
});