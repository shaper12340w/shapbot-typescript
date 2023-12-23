import {
    SlashCommandBuilder,
    CommandInteraction,
    AttachmentBuilder,
    EmbedBuilder,
    ButtonInteraction,
    Message
} from 'discord.js';
import {Command} from '../../structures/Command'
import {_2048, userGame} from "../../plugins/common/games";
import {createButtonSet} from "../../plugins/discord/interactions";

type moveStr = "up" | "down" | "left" | "right";
export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('tfze')
            .setNameLocalizations({
                "ko": "이공사팔"
            })
            .setDescription('2048게임을 시작합니다'),
        async execute(interaction: CommandInteraction) {

            const sender: string = interaction.user.id;

            if (!userGame.has(sender)) {
                //게임 시작 부분
                userGame.set(sender, new _2048());
                const startGame = userGame.get(sender)!!.start(4);

                //버튼 부분
                const emojiList = ['⬆', '⬇', '⬅', '➡'];
                const buttonSet = createButtonSet(interaction.id, [
                    {
                        emoji: emojiList[0],
                        style: 1,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                move2048("up", interaction, userGame.get(interaction.user.id))
                            }
                        }
                    },
                    {
                        emoji: emojiList[1],
                        style: 1,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                move2048("down", interaction, userGame.get(interaction.user.id))
                            }
                        }
                    },
                    {
                        emoji: emojiList[2],
                        style: 1,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                move2048("left", interaction, userGame.get(interaction.user.id))
                            }
                        }
                    },
                    {
                        emoji: emojiList[3],
                        style: 1,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                move2048("right", interaction, userGame.get(interaction.user.id))
                            }
                        }
                    },
                    {
                        label: "포기",
                        style: 4,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                userGame.get(interaction.user.id)!!.drawGameOver();
                                const file = new AttachmentBuilder(userGame.get(interaction.user.id)!!.saveImage(), {name: interaction.user.id + ".png"});
                                interaction.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xD93030)
                                            .setTitle('**[2048]**')
                                            .setDescription("YOU LOSE..\n\nscore : " + String(userGame.get(interaction.user.id)!!.score))
                                            .setImage(`attachment://${interaction.user.id}.png`)
                                    ], files: [file]
                                });
                                userGame.get(interaction.user.id)!!.message!!.delete();
                                userGame.delete(interaction.user.id);
                            }
                        }
                    },
                ])

                //움직이는 부분
                function move2048(moveTo: moveStr, msgData: ButtonInteraction, data?: _2048) {
                    const click = data!!.move(moveTo);

                    if (!click) {
                        msgData.reply({content: '움직일 수 없습니다!', ephemeral: true});
                    } else {
                        const file = new AttachmentBuilder(click.image, {name: msgData.user.id + ".png"});
                        switch (click.status) {
                            case "win":
                                msgData.channel!!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0x44E36E)
                                            .setTitle('**[2048]**')
                                            .setDescription("YOU WIN!!\n\nscore : " + String(click.score))
                                            .setImage(`attachment://${msgData.user.id}.png`)
                                    ], files: [file]
                                });
                                data!!.message!!.delete();
                                userGame.delete(msgData.user.id);
                                break;
                            case "lose":
                                msgData.channel!!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xD93030)
                                            .setTitle('**[2048]**')
                                            .setDescription("YOU LOSE..\n\nscore : " + String(click.score))
                                            .setImage(`attachment://${msgData.user.id}.png`)
                                    ], files: [file]
                                });
                                data!!.message!!.delete();
                                userGame.delete(msgData.user.id);
                                break;
                            case "proceeding":
                                msgData.deferUpdate().catch(console.error);
                                data!!.message!!.edit({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0x0099FF)
                                            .setTitle('**[2048]**')
                                            .setDescription("score : " + String(click.score))
                                            .setImage(`attachment://${msgData.user.id}.png`)
                                    ], files: [file]
                                });
                                break;
                        }
                    }
                }

                //파일 전송
                const file = new AttachmentBuilder(startGame.image as Buffer, {name: interaction.user.id + ".png"});
                userGame.get(sender)!!.message = await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle('**[2048]**')
                            .setDescription("score : " + String(startGame.score))
                            .setImage(`attachment://${String(interaction.user.id)}.png`)
                    ], files: [file], components: [buttonSet], fetchReply: true
                });

            } else {
                interaction.reply({content: '이미 게임중이십니다만?', ephemeral: true});
            }
        },
    },
    message: {
        data: {
            name: "2048",
            duplicatedData: ["tfze"],
            description: "2048게임을 시작합니다",
        },
        async execute(message: Message) {

            const sender: string = message.author.id;

            if (!userGame.has(sender)) {
                //게임 시작 부분
                userGame.set(sender, new _2048());
                const startGame = userGame.get(sender)!!.start(4);

                //버튼 부분
                const emojiList = ['⬆', '⬇', '⬅', '➡'];
                const buttonSet = createButtonSet(message.id, [
                    {
                        emoji: emojiList[0],
                        style: 1,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                move2048("up", interaction, userGame.get(interaction.user.id))
                            }
                        }
                    },
                    {
                        emoji: emojiList[1],
                        style: 1,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                move2048("down", interaction, userGame.get(interaction.user.id))
                            }
                        }
                    },
                    {
                        emoji: emojiList[2],
                        style: 1,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                move2048("left", interaction, userGame.get(interaction.user.id))
                            }
                        }
                    },
                    {
                        emoji: emojiList[3],
                        style: 1,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                move2048("right", interaction, userGame.get(interaction.user.id))
                            }
                        }
                    },
                    {
                        label: "포기",
                        style: 4,
                        async execute({interaction}) {
                            if (!userGame.has(interaction.user.id)) {
                                interaction.reply({content: '남꺼 함부로 만지지 마욧', ephemeral: true})
                            } else {
                                userGame.get(interaction.user.id)!!.drawGameOver();
                                const file = new AttachmentBuilder(userGame.get(interaction.user.id)!!.saveImage(), {name: interaction.user.id + ".png"});
                                interaction.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xD93030)
                                            .setTitle('**[2048]**')
                                            .setDescription("YOU LOSE..\n\nscore : " + String(userGame.get(interaction.user.id)!!.score))
                                            .setImage(`attachment://${interaction.user.id}.png`)
                                    ], files: [file]
                                });
                                userGame.get(interaction.user.id)!!.message!!.delete();
                                userGame.delete(interaction.user.id);
                            }
                        }
                    },
                ])

                //움직이는 부분
                function move2048(moveTo: moveStr, msgData: ButtonInteraction, data?: _2048) {
                    const click = data!!.move(moveTo);

                    if (!click) {
                        msgData.reply({content: '움직일 수 없습니다!', ephemeral: true});
                    } else {
                        const file = new AttachmentBuilder(click.image, {name: msgData.user.id + ".png"});
                        switch (click.status) {
                            case "win":
                                msgData.channel!!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0x44E36E)
                                            .setTitle('**[2048]**')
                                            .setDescription("YOU WIN!!\n\nscore : " + String(click.score))
                                            .setImage(`attachment://${msgData.user.id}.png`)
                                    ], files: [file]
                                });
                                data!!.message!!.delete();
                                userGame.delete(msgData.user.id);
                                break;
                            case "lose":
                                msgData.channel!!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0xD93030)
                                            .setTitle('**[2048]**')
                                            .setDescription("YOU LOSE..\n\nscore : " + String(click.score))
                                            .setImage(`attachment://${msgData.user.id}.png`)
                                    ], files: [file]
                                });
                                data!!.message!!.delete();
                                userGame.delete(msgData.user.id);
                                break;
                            case "proceeding":
                                msgData.deferUpdate().catch(console.error);
                                data!!.message!!.edit({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(0x0099FF)
                                            .setTitle('**[2048]**')
                                            .setDescription("score : " + String(click.score))
                                            .setImage(`attachment://${msgData.user.id}.png`)
                                    ], files: [file]
                                });
                                break;
                        }
                    }
                }

                //파일 전송
                const file = new AttachmentBuilder(startGame.image as Buffer, {name: message.author.id + ".png"});
                userGame.get(sender)!!.message = await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle('**[2048]**')
                            .setDescription("score : " + String(startGame.score))
                            .setImage(`attachment://${String(message.author.id)}.png`)
                    ], files: [file], components: [buttonSet]
                });

            } else {
                message.reply({content: '이미 게임중이십니다만?'});
            }
        },
    },
});