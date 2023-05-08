import { Event } from '../structures/Event'
import { client,emitter } from '../app';
import { ChatInputCommandInteraction, Interaction } from 'discord.js';

export default new Event({
    name: "interactionCreate",
    async run(interaction: Interaction) {
        const command = client.commands.get((<ChatInputCommandInteraction>interaction).commandName);
        try {
            if (interaction.isChatInputCommand()) {
                if (!command) return;
                await command.execute(interaction);
            }
            if (interaction.isButton()) {
                emitter.emit(interaction.customId, interaction);
            }
            if (interaction.isModalSubmit()) {
                emitter.emit(interaction.customId, interaction);
            }
            if (interaction.isStringSelectMenu()) {
                emitter.emit(interaction.customId, interaction);
            }
        } catch (e) {
            console.error(e);
        }
    }
})