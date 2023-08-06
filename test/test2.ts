// @ts-ignore
import Deps from './deps';
import { ActionRowBuilder, AnySelectMenuInteraction, APISelectMenuOption, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, Client, CommandInteraction, ComponentEmojiResolvable, GuildTextBasedChannel, MentionableSelectMenuBuilder, MentionableSelectMenuInteraction, Message, MessageComponentInteraction, ModalBuilder, ModalSubmitInteraction, RoleSelectMenuBuilder, RoleSelectMenuInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle, ThreadChannel, UserSelectMenuBuilder, UserSelectMenuInteraction } from 'discord.js';
// @ts-ignore
import Util from './util';
// @ts-ignore
import CustomEventEmitter from '../handlers/custom-event-emitter.ts';
// @ts-ignore
import Log from './log';
// @ts-ignore
import Bot from '../plugins/socket/bot';

interface AnySelectMenuData<T extends AnySelectMenuInteraction> {
    id: string;
    disabled?: boolean;
    length?: [number, number];
    placeholder?: string;
    execute: (data: {
        interaction: T;
        kill: () => void;
    }) => void | Promise<void>;
}

interface Button {
    disabled?: boolean;
    emoji?: ComponentEmojiResolvable
    label?: string;
    style?: ButtonStyle;
    url?: string;
}

interface ButtonInit extends Button {
    execute: (data: {
        interaction: ButtonInteraction;
        edit: (...options: Button[]) => ActionRowBuilder<ButtonBuilder>;
        kill: () => void;
    }) => void | Promise<void>;
}

interface ModalData {
    inputs: TextInput[];
    title: string;
}

interface StringSelectMenuData extends AnySelectMenuData<StringSelectMenuInteraction> {
    options: APISelectMenuOption[];
}

interface TextInput {
    label: string;
    length?: [number, number];
    placeholder?: string;
    required?: boolean;
    style: TextInputStyle;
    value?: string;
}

interface ThreadData {
    autoArchiveDuration?: number;
    name: string;
    rateLimitPerUser?: number;
    reason?: string;
    execute?: (data: {
        message: Message<true>;
        thread: ThreadChannel;
        kill: () => Promise<void>;
    }) => void | Promise<void>;
}

const emitter = Deps.get<CustomEventEmitter>(CustomEventEmitter);

export class Discord {
    public static authenticate(email: string, interaction: CommandInteraction) {
        return Util.getPromise<ModalSubmitInteraction, [string, ModalSubmitInteraction]>(
            // @ts-ignore
            async (resolve, reject) => {
                this.createModal(interaction, {
                    title: '계정 인증하기',
                    inputs: [{
                        label: '계정 인증 코드',
                        length: [6, 6],
                        placeholder: `${email} 계정으로 전송된 코드를 입력해 주세요.`,
                        required: true,
                        style: 1
                    }]
                }).then(async ({ interaction, inputs }) => {
                    const [codeInput] = inputs;
                    if (codeInput === code) return resolve(interaction);

                    reject(['일치하지 않는 코드입니다.\n계정 인증에 실패했습니다.', interaction]);
                }).catch();

                const code = new Array(6).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
                await Util.sendEmail({
                    to: email,
                    subject: '[AlphaDo] 계정 인증 메일',
                    text: `계정 인증 코드는 [${code}] 입니다.`
                });
            }
        );
    }

    public static createButtonSet(customId: string, buttons: ButtonInit[], valid?: number) {
        function createButtonSet(buttons: Button[]) {
            return new ActionRowBuilder<ButtonBuilder>().setComponents(
                ...buttons.map((button: Button, index: number) => {
                    const builder = new ButtonBuilder()
                        .setDisabled(button.disabled ?? false)
                        .setStyle(button.style ?? 1);

                    if (button.emoji) builder.setEmoji(button.emoji);
                    if (button.label) builder.setLabel(button.label);

                    if (button.url) {
                        builder.setURL(button.url);
                        return builder;
                    }

                    builder.setCustomId(`${customId}#${index}`);
                    return builder;
                })
            );
        }

        buttons.forEach((button: ButtonInit, index: number) => {
            emitter.on(`${customId}#${index}`, (interaction: ButtonInteraction) => {
                button.execute({
                    interaction,
                    edit(...options: Button[]) {
                        buttons.forEach((button: Button, index: number) => {
                            const { disabled, emoji, label, style, url } = options[index] ?? {};
                            button.disabled = disabled ?? button.disabled;
                            button.emoji = emoji ?? button.emoji;
                            button.label = label ?? button.label;
                            button.style = style ?? button.style;
                            button.url = url ?? button.url;
                        });
                        return createButtonSet(buttons);
                    },
                    kill() {
                        buttons.forEach((_button, index: number) => emitter.off(`${customId}#${index}`));
                    }
                });
            }, valid);
        });

        return createButtonSet(buttons);
    }

    public static createChannelSelectMenuBuilder(
        data: AnySelectMenuData<ChannelSelectMenuInteraction>, valid?: number
    ) {
        emitter.on(data.id, (interaction: ChannelSelectMenuInteraction) => {
            data.execute({
                interaction,
                kill() {
                    emitter.off(data.id);
                }
            });
        }, valid);

        return new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId(data.id)
                .setMaxValues(data.length?.[1] ?? 1)
                .setMinValues(data.length?.[0] ?? 1)
                .setPlaceholder(data.placeholder ?? 'Nothing Selected')
        );
    }

    public static createMentionableSelectMenuBuilder(
        data: AnySelectMenuData<MentionableSelectMenuInteraction>, valid?: number
    ) {
        emitter.on(data.id, (interaction: MentionableSelectMenuInteraction) => {
            data.execute({
                interaction,
                kill() {
                    emitter.off(data.id);
                }
            });
        }, valid);

        return new ActionRowBuilder<MentionableSelectMenuBuilder>().setComponents(
            new MentionableSelectMenuBuilder()
                .setCustomId(data.id)
                .setMaxValues(data.length?.[1] ?? 1)
                .setMinValues(data.length?.[0] ?? 1)
                .setPlaceholder(data.placeholder ?? 'Nothing Selected')
        );
    }

    public static async createModal(
        interaction: CommandInteraction | MessageComponentInteraction,
        data: ModalData
    ) {
        type Result = { interaction: ModalSubmitInteraction; inputs: string[]; };
        return new Promise<Result>(async (
            resolve: (result: Result) => void,
            reject: (reason: string) => void
        ) => {
            try {
                const inputs = data.inputs.map((input: TextInput, index: number) => {
                    const builder = new TextInputBuilder()
                        .setCustomId(`${interaction.id}#${index}`)
                        .setLabel(input.label)
                        .setMaxLength(input.length?.[1] ?? 4000)
                        .setMinLength(input.length?.[0] ?? 0)
                        .setPlaceholder(input.placeholder ?? '')
                        .setRequired(input.required)
                        .setStyle(input.style);

                    if (input.value) builder.setValue(input.value);

                    return builder;
                });

                const modal = new ModalBuilder()
                    .setCustomId(interaction.id)
                    .setTitle(data.title)
                    .setComponents(inputs.map((input: TextInputBuilder) =>
                        new ActionRowBuilder<TextInputBuilder>().setComponents(input)
                    ));

                await interaction.showModal(modal).catch(reject);
                emitter.once(interaction.id, (modalInteraction: ModalSubmitInteraction) => {
                    resolve({
                        interaction: modalInteraction,
                        inputs: inputs.map((input: TextInputBuilder) =>
                            modalInteraction.fields.getTextInputValue(input.toJSON().custom_id))
                    });
                    emitter.off(interaction.id);
                }, 10);
            } catch (error: unknown) {
                const message = (error as Error ?? 'Unknown Error').toString();
                reject(message);
                Log.error(message, 'CreateModal');
            }
        });
    }

    public static createRoleSelectMenuBuilder(
        data: AnySelectMenuData<RoleSelectMenuInteraction>, valid?: number
    ) {
        emitter.on(data.id, (interaction: RoleSelectMenuInteraction) => {
            data.execute({
                interaction,
                kill() {
                    emitter.off(data.id);
                }
            });
        }, valid);

        return new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
            new RoleSelectMenuBuilder()
                .setCustomId(data.id)
                .setMaxValues(data.length?.[1] ?? 1)
                .setMinValues(data.length?.[0] ?? 1)
                .setPlaceholder(data.placeholder ?? 'Nothing Selected')
        );
    }

    public static createStringSelectMenuBuilder(data: StringSelectMenuData, valid?: number) {
        emitter.on(data.id, (interaction: StringSelectMenuInteraction) => {
            data.execute({
                interaction,
                kill() {
                    emitter.off(data.id);
                }
            });
        }, valid);

        return new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            new StringSelectMenuBuilder()
                .setCustomId(data.id)
                .setDisabled(data.disabled ?? false)
                .setMaxValues(data.length?.[1] ?? 1)
                .setMinValues(data.length?.[0] ?? 1)
                .setOptions(...data.options)
                .setPlaceholder(data.placeholder ?? 'Nothing Selected')
        );
    }

    public static async createThread(message: Message, data: ThreadData, valid?: number) {
        type Result = { thread: ThreadChannel; kill: () => Promise<void>; };
        return new Promise<Result>(async (
            resolve: (thread: Result) => void,
            reject: (reason: string) => void
        ) => {
            try {
                const thread = await message.startThread({
                    autoArchiveDuration: data.autoArchiveDuration,
                    name: data.name,
                    rateLimitPerUser: data.rateLimitPerUser,
                    reason: data.reason
                });

                async function kill() {
                    await thread.setLocked(true);
                    await thread.setArchived(true);
                    emitter.off(`threadMessage#${thread.id}`);
                }

                resolve({ thread, kill });
                emitter.on(`threadMessage#${thread.id}`, (threadMessage: Message<true>) => {
                    if (data.execute) {
                        data.execute({
                            message: threadMessage,
                            thread,
                            kill
                        });
                    }
                }, valid);
            } catch (error: unknown) {
                reject((error as Error).toString());
                console.error(error);
            }
        });
    }

    public static createUserSelectMenuBuilder(
        data: AnySelectMenuData<UserSelectMenuInteraction>, valid?: number
    ) {
        emitter.on(data.id, (interaction: UserSelectMenuInteraction) => {
            data.execute({
                interaction,
                kill() {
                    emitter.off(data.id);
                }
            });
        }, valid);

        return new ActionRowBuilder<UserSelectMenuBuilder>().setComponents(
            new UserSelectMenuBuilder()
                .setCustomId(data.id)
                .setMaxValues(data.length?.[1] ?? 1)
                .setMinValues(data.length?.[0] ?? 1)
                .setPlaceholder(data.placeholder ?? 'Nothing Selected')
        );
    }

    public static getChannel(id: string) {
        const bot = Deps.get<Client>(Client);
        return bot.channels.cache.get(id);
    }

    public static getGuild(id: string) {
        const bot = Deps.get<Client>(Client);
        return bot.guilds.cache.get(id);
    }

    public static getUser(id: string) {
        const bot = Deps.get<Client>(Client);
        return bot.users.cache.get(id);
    }

    public static async fetchChannel(id: string) {
        const bot = Deps.get<Client>(Client);
        return await bot.channels.fetch(id);
    }

    public static async fetchGuild(id: string) {
        const bot = Deps.get<Client>(Client);
        return await bot.guilds.fetch(id);
    }

    public static async fetchUser(id: string) {
        const bot = Deps.get<Client>(Client);
        return await bot.users.fetch(id);
    }

    public static async sendMessage(id: string, message: string) {
        const channel = this.getChannel(id);
        if (!channel || !channel.isTextBased()) return;
        return await channel.send(message);
    }
}

export { Bot as KakaoTalk }