import { Event } from '../structures/Event'
import { client,emitter } from '../app';
import {ChatInputCommandInteraction, Interaction, MessageComponentInteraction} from 'discord.js';
import {Logger} from "../plugins/common/logger";

export default new Event({
    name: "interactionCreate",
    async run(interaction: Interaction) {
        const commandName = (<ChatInputCommandInteraction>interaction).commandName;
        const command = client.commands.get(commandName);
        const commonCommand = client.commonCommands.get(commandName);
        try {

            Logger.debug("interaction Create 에서 옴 "+(interaction as MessageComponentInteraction).customId)
            if (interaction.isChatInputCommand()) {
                if (command?.execute)
                    await command.execute!!(interaction);
                if(commonCommand)
                    await commonCommand(interaction);
            }
            if(interaction.isAutocomplete()){
                if (!command) return;
                try {
                    await command.autocomplete!!(interaction)
                }
                catch (e){
                    Logger.error(new Error("Cannot find Autocomplete function in "+commandName+" command."))
                }
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