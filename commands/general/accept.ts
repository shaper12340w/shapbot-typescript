import {SlashCommandBuilder, CommandInteraction, Message} from 'discord.js';
import {Command} from '../../structures/Command'
import {UserProperty} from "../../structures/Property";

async function process(interaction:CommandInteraction|Message){
    const user = (interaction instanceof Message) ? interaction.author : interaction.user
    const userData = await UserProperty.get(user.id)
    if(!userData){
        await UserProperty.set(user.id)
    }

}


export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('accept')
            .setDescription('약관에 동의합니다'),
        async execute(interaction: CommandInteraction) {

        },
    },
    message: {
        data: {
            name: "allow",
            description: "약관에 동의합니다",
        },
        async execute(message) {

        }
    }
});