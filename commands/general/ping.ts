import {SlashCommandBuilder, CommandInteraction} from 'discord.js';
import {Command} from '../../structures/Command'

export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('ping')
            .setNameLocalizations({
                "ko": "핑"
            })
            .setDescription('Replies with Pong!'),
        async execute(interaction: CommandInteraction) {
            await interaction.reply('Pong!');
        },
    },
    message: {
        data: {
            name: "ping",
            description: "Pong!",
        },
        async execute(message) {
            await message.reply("Pong!");
        }
    }
});