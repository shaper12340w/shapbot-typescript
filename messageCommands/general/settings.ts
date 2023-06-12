import {
    CommandInteraction,
    PermissionsBitField,
    EmbedBuilder,
    GuildBasedChannel, ButtonInteraction, Message, ModalSubmitInteraction
} from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { createModal, createButtonSet, createStringSelectMenuBuilder } from '../../modules/discord/interactions'
import { client } from "../../app";
export default new MessageCommand({
    data: {
        name: 'settings',
        duplicatedData:["setting","설정"],
        description: '서버 봇 설정',
    },

    async execute(message:Message){
        const { notice, prefix, inviteRoom } = client.serverProperty.get(message.guildId!!)!!;
        const isAdmin = (interaction:CommandInteraction|ButtonInteraction) => (<PermissionsBitField>interaction.member!!.permissions).has(PermissionsBitField.Flags.Administrator);
        const botName = message.guild!!.members.cache.get(client.user!!.id)!!.displayName;
        const killList:(()=>void)[] = [];

        if (killList.length <= 0) {
            killList.forEach(e => e());
        }

        function setChannel(msg:string, eventName:"prefix"|"notice"|"inviteRoom", interaction:ModalSubmitInteraction) {
            const getMsg = msg.replace(/\s/g, "-")
            const option = (channel:GuildBasedChannel) => channel.permissionsFor(client.user!!)!!.has(PermissionsBitField.Flags.SendMessages) && (channel.type === 0 || channel.type === 5) && channel.name.includes(getMsg)
            const channel = interaction.guild!!.channels.cache.filter(option);

            if(msg.length < 1){
                interaction.reply("해당 설정은 `사용 안함`으로 설정되었습니다")
                client.serverProperty.get(interaction.guild!!.id)!![eventName] = "";
                return;
            }

            if (channel.size === 0) {
                interaction.reply(getMsg + "채널을 찾을 수 없습니다!");
                return;
            }
            if (channel.size === 1) {
                client.serverProperty.get(interaction.guild!!.id)!![eventName] = channel.first()!!.id;
                interaction.reply(`채널이 <#${channel.first()!!.id}>으로 설정되었습니다!`)
            } else {
                const menu = createStringSelectMenuBuilder({
                    id: interaction.id,
                    options: channel.map(e => {
                        return {
                            label: e.name,
                            value: e.id,
                            description: e.id
                        }
                    }),
                    execute({ interaction }) {
                        const [value] = interaction.values
                        client.serverProperty.get(interaction.guild!!.id)!![eventName] = value;
                        interaction.reply(`채널이 <#${value}>으로 설정되었습니다!`)

                    }
                    }
                )
                interaction.reply({ components: [menu] })
            }
        }

        const helpEmbed = new EmbedBuilder()
            .setColor(0x44E36E)
            .setTitle(`${message.guild!!.name} 의 봇 설정`)
            .setDescription(`현재 ${message.guild!!.name}의 ${botName}의 설정은 다음과 같습니다\n\n접두사:${prefix}\n봇 공지:${notice ? "<#" + notice + ">" : "없음"}\n초대 메시지:${inviteRoom ? "<#" + inviteRoom + ">" : "없음"}`)
            .setFooter({ text: `아래의 버튼을 눌러 ${botName} 봇의 설정을 할 수 있습니다` });

        const helpButton = createButtonSet(message.id, [
            {
                label: "접두사",
                style: 3,
                async execute({ interaction, kill }) {
                    killList.push(kill)
                    if (isAdmin(interaction)) {
                        createModal(interaction, {
                            title: "접두사 설정",
                            inputs: [{
                                label: '접두사',
                                length: [0, 10],
                                placeholder: '접두사를 입력해 주세요.',
                                required: true,
                                style: 1,
                                value: prefix
                            }]
                        }).then(async ({ interaction, inputs }) => {
                            const [title] = inputs;
                            const sendIsSpace:{message?:Message} = {}
                            const isSpaceButton = createButtonSet(interaction.id, [
                                {
                                    label: "예",
                                    style: 3,
                                    async execute({ interaction, kill }) {
                                        if (isAdmin(interaction)) {
                                            client.serverProperty.get(interaction.guild!!.id)!!.prefix = title + " ";
                                            const nowPrefix = client.serverProperty.get(interaction.guild!!.id)!!.prefix;
                                            await interaction.reply(`접두사가 '${nowPrefix}'로 변경되었습니다\n테스트:${nowPrefix}ㅎㅇ`)
                                            await sendIsSpace.message!!.delete();
                                        } else {
                                            await interaction.reply({ content: '당신은 관리자가 아닙니다!', ephemeral: true });
                                        }
                                    }
                                },
                                {
                                    label: "아니오",
                                    style: 4,
                                    async execute({ interaction, kill }) {
                                        if (isAdmin(interaction)) {
                                            client.serverProperty.get(interaction.guild!!.id)!!.prefix = title;
                                            const nowPrefix = client.serverProperty.get(interaction.guild!!.id)!!.prefix;
                                            await interaction.reply(`접두사가 '${nowPrefix}'로 변경되었습니다\n테스트:${nowPrefix}ㅎㅇ`)
                                            await sendIsSpace!!.message!!.delete();
                                        } else {
                                            await interaction.reply({ content: '당신은 관리자가 아닙니다!', ephemeral: true });
                                        }
                                    }
                                }
                            ]);
                            sendIsSpace.message = await interaction.reply({ embeds: [new EmbedBuilder().setTitle("접두사 뒤에 공백을 붙이시겠습니까?").setColor(0x0099FF).setDescription(`붙일 시: "${title + " "}"\n안 붙일 시: "${title}"`)], components: [isSpaceButton], fetchReply: true })
                        })
                    } else {
                        await interaction.reply({ content: '당신은 관리자가 아닙니다!', ephemeral: true });
                    }
                }
            },
            {
                label: "공지",
                style: 3,
                async execute({ interaction, kill }) {
                    killList.push(kill)
                    if (isAdmin(interaction)) {
                        createModal(interaction, {
                            title: "공지 채널 설정",
                            inputs: [{
                                label: '공지 채널 이름',
                                length: [0, 50],
                                required: false,
                                placeholder: '채널 이름을 입력해 주세요.(비울시 설정 안 함)',
                                style: 1,
                                value: (notice ? (<GuildBasedChannel>client.channels.cache.get(notice)).name : "")
                            }]
                        }).then(async ({ interaction, inputs }) => {
                            const [title] = inputs;
                            setChannel(title, "notice", interaction);
                        })
                    } else {
                        await interaction.reply({ content: '당신은 관리자가 아닙니다!', ephemeral: true });
                    }
                }
            },
            {
                label: "초대",
                style: 3,
                async execute({ interaction, kill }) {
                    killList.push(kill)
                    if (isAdmin(interaction)) {
                        createModal(interaction, {
                            title: "초대 채널 설정",
                            inputs: [{
                                label: '초대 채널 이름',
                                length: [0, 50],
                                required: false,
                                placeholder: '채널 이름을 입력해 주세요.(비울시 설정 안 함)',
                                style: 1,
                                value: (inviteRoom ? (<GuildBasedChannel>client.channels.cache.get(inviteRoom)!!).name : "")
                            }]
                        }).then(async ({ interaction, inputs }) => {
                            const [title] = inputs;
                            setChannel(title, "inviteRoom", interaction);
                        })
                    } else {
                        await interaction.reply({ content: '당신은 관리자가 아닙니다!', ephemeral: true });
                    }
                }
            }
        ])

        await message.reply({ embeds: [helpEmbed], components: [helpButton] })
    }
})