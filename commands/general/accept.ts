import {
    SlashCommandBuilder,
    CommandInteraction,
    Message,
    EmbedBuilder,
    ReactionCollectorOptions,
    MessageReaction, User, Embed, CommandInteractionOptionResolver
} from 'discord.js';
import {Command} from '../../structures/Command'
import {UserProperty} from "../../structures/Property";
import {Logger} from "../../plugins/common/logger";


export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('terms')
            .setDescription('약관에 동의합니다'),
    },
    message: {
        data: {
            name: "allow",
            description: "약관에 동의합니다",
        },
    },
    async execute(interactionMessage) {
        const main_user = (interactionMessage instanceof Message) ? interactionMessage.author : interactionMessage.user
        const userData = await UserProperty.get(main_user.id);
        const isInteraction = interactionMessage instanceof CommandInteraction;
        if(isInteraction && interactionMessage.options.resolved) return;
        if (!userData) {
            const embed = new EmbedBuilder()
                .setTitle("약관 동의")
                .addFields({
                    name: "약관에 동의하시겠습니까?",
                    value: "약관을 읽지 않거나 동의하지 않아 생기는 불이익은 보장되지 않습니다"
                })
                .setColor("#56eca1")
                .setFooter({
                    text: "동의하시려면 아래 버튼을 눌러주세요",
                })
            const message = await interactionMessage.reply({embeds: [embed], fetchReply: true});
            message.react('✅');
            const filter = (reaction: MessageReaction, user: User) =>
                reaction.emoji.name === '✅' &&
                !user.bot &&
                user.id === main_user.id

            const collector = message.createReactionCollector({filter})

            collector.on("end", (collected,reason) => {
                if(reason === "time"){
                    message.channel.send({content: " - 시간이 지나 자동으로 취소되었습니다"});
                    message.delete()
                }
            });

            collector.on('collect', (reaction, user) => {
                if (user.id === main_user.id) {
                    UserProperty.set(user.id)
                    Logger.debug("작동됨")
                    reaction.message.channel!!.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#56eca1")
                                .setTitle("✅ 동의되었습니다!")
                                .setDescription("앞으로 샾봇의 모든 기능을 이용하실 수 있습니다")
                        ]
                    })
                }
            })
        } else {
            const embed = new EmbedBuilder()
                .setTitle("❌ | 이미 동의하셨습니다")
                .setColor("#ff052a")
            interactionMessage.reply({embeds: [embed]})
        }
    }
})