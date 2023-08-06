/**

import { SlashCommandBuilder,CommandInteraction, MessageReplyOptions } from 'discord.js';
import { Command } from '../../structures/Command'
import { createButtonSet, createModal } from '../../plugins/discord/interactions';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('buttontest')
		.setDescription('buttontest'),
	async execute(interaction:CommandInteraction) {
		const buttonSet = createButtonSet(interaction.id, [
            {
                label: 'Primary',
                style: 1,
                async execute({ interaction, edit }) {
                    const message = await interaction.update({ components: [edit({}, { disabled: false },{ style : 3 , label : "Tertiary"},{})], fetchReply: true });
                    await message.reply(<MessageReplyOptions>{ content: 'Primary 버튼을 누르셨어요?', ephemeral: true });
                    console.log(interaction.member!!.user.username)
                }
            },
            {
                label: 'Secondary',
                style: 2,
                emoji: { name: '1️⃣' },
                async execute({ interaction, edit }) {
                    const message = await interaction.update({ components: [edit({}, { disabled: true, emoji: { name: '2️⃣' } },{},{})], fetchReply: true });
                    await message.reply('Secondary 버튼을 누르셨군요!');
                    console.log(interaction.member!!.user.username)
                }
            }
            ,
            {
                label: 'Tertiary',
                style: 3,
                async execute({ interaction, edit }) {
                    const message = await interaction.update({ components: [edit({}, {},{ style : 1 ,label : "센즈" },{})], fetchReply: true });
                    await message.reply('Third 버튼을 누르셨군요!');
                    console.log(interaction.member!!.user.username)
                }
            },
            {
                label: 'Quaternary',
                style: 4,
                async execute({ interaction, edit }) {
                    createModal(interaction,{
                        title:"Modal Test",
                        inputs: [{
                                label: '제목',
                                length : [0,50],
                                placeholder: '제목을 입력해 주세요.',
                                required: true,
                                style:1
                            },
                            {
                                label: '내용',
                                length : [0,300],
                                placeholder: '제목을 입력해 주세요.',
                                required: true,
                                style:2,
                                value: "내용 value"
                            },
                            {
                                label: '내용2',
                                length : [0,300],
                                placeholder: '내용입력해',
                                required: true,
                                style:2,
                                value: "와센즈"
                            }
                        ]

                    }).then(async ({ interaction, inputs}) =>{
                        const [title, content,content2] = inputs;
                        await interaction.reply(`제목: ${title}\n내용: ${content}\n내용2: ${content2}`)
                    })
                    console.log(interaction.member!!.user.username)
                }
            },
        ]);
        await interaction.reply({ content: '버튼을 눌러보세요!', components: [buttonSet] });
	},
});
 */