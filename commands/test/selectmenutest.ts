import { SlashCommandBuilder,CommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command'
import { createStringSelectMenuBuilder } from '../../modules/common/interactions';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('selectmenutest')
		.setDescription('selectmenutest'),
	async execute(interaction:CommandInteraction) {
		const selectmenu = createStringSelectMenuBuilder({
            id:"asdf",
            options:[
                {
                    label:"와 센즈",
                    value:"아시는구나",
                    description:"센즈가 외칩니다"
                },
                {
                    label:"와 토리엘",
                    value:"모르시는구나",
                    description:"토리엘이 외칩니다"
                }
            ],
            execute({ interaction }) {
                const [value] = interaction.values
                interaction.reply(value);
            },
        })
        interaction.reply({components:[selectmenu]})
	}
});