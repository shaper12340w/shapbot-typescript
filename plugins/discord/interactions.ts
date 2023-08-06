/**
 * 본 파일의 1차 제작자는 AlphaDo님으로 AlphaDo님이 만든 파일을 재구성 한 것입니다
 * 저작권은 1차 제작자인 AlphaDo님에게 있습니다
 * 자세한 내용은 문의 바랍니다
 */

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelSelectMenuInteraction,
    CommandInteraction,
    ComponentEmojiResolvable,
    Message,
    MessageComponentInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
    RoleSelectMenuBuilder,
    RoleSelectMenuInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    TextInputBuilder,
    UserSelectMenuBuilder,
    UserSelectMenuInteraction,
    AnySelectMenuInteraction,
    APISelectMenuOption,
    MentionableSelectMenuBuilder,
    MentionableSelectMenuInteraction,
    ThreadChannel
} from "discord.js";
import {emitter} from "../../app";

//=============================================================

//----Button----
interface Button {
    disabled?: boolean;
    emoji?: ComponentEmojiResolvable;
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

//----Modal----
interface TextInput {
    label: string;
    length?: [number, number];
    placeholder?: string;
    required?: boolean;
    style: 1 | 2;
    value?: string;
}

interface ModalData {
    title: string;
    inputs: TextInput[];
}

//----SelectMenu----

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

interface StringSelectMenuData extends AnySelectMenuData<StringSelectMenuInteraction> {
    options: APISelectMenuOption[];
}

//----Thread----
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

//=============================================================

export function createButtonSet(customId: string, buttons: ButtonInit[], valid?: number) {
    function createButtonSet(buttons: Button[]) {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...buttons.map((button: Button, index: number) => {
                const builder = new ButtonBuilder()
                    .setCustomId(`${customId}#${index}`)
                    .setDisabled(button.disabled ?? false)
                    .setStyle(<number>button.style);

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

    buttons.forEach((button: ButtonInit, index) => {
        emitter.on(`${customId}#${index}`, (interaction: ButtonInteraction) => {
            button.execute({
                interaction,
                edit(...options: Button[]) {
                    buttons.forEach((button, index) => {
                        const {disabled, emoji, label, style, url} = options[index] ?? {};
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

export async function createModal(
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
            console.error(message, 'CreateModal');
        }
    });
}

export function createChannelSelectMenuBuilder(
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

export function createMentionableSelectMenuBuilder(
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

export function createRoleSelectMenuBuilder(
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

export function createStringSelectMenuBuilder(data: StringSelectMenuData, valid?: number) {
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

export function createUserSelectMenuBuilder(
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

export function createThread(message: Message, data: ThreadData, valid?: number) {
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

            resolve({thread, kill});
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


