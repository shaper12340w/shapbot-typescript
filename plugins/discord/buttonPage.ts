import {
    ActionRowBuilder, AnyComponentBuilder,
    BaseMessageOptions,
    ButtonBuilder, ButtonInteraction,
    ButtonStyle, CommandInteraction,
    ComponentType, InteractionCollector,
    InteractionResponse, Message, MessageComponentInteraction
} from "discord.js";
import {EventEmitter} from "events";
import {Logger} from "../common/logger";

/* //embed//
 * <- 3/5 ->
 * Optional page index
 */

export interface PagedButtonOptions {
    start: number;
    end: number;
    default?: number;
    showIndex?: boolean;
    label?: LabelOptions;
    destroy?: DestroyOptions;
}

export interface LabelOptions {
    prev?: string,
    index?: string,
    next?: string,
}

export interface DestroyOptions {
    afterMillis?: number;
    disableComponents?: boolean;
}

export class PagedButton {
    private _options: PagedButtonOptions
    private message: BaseMessageOptions | null = null;

    private eventBus: EventEmitter;
    private collector: InteractionCollector<any> | null = null;
    private idx: number;

    static EVENT_PAGE_UPDATE = 'pageUpdate';
    static EVENT_DESTROY = 'destroy';
    static KEY_INDEX = '{idx}';
    static KEY_END = '{end}';
    private static ID_PREV = "prev";
    private static ID_NEXT = "next";
    private static ID_IDX = "idx";

    constructor(options: PagedButtonOptions) {
        this._options = options;

        this.idx = options.default ?? options.start;
        if (this.idx < options.start || this.idx > options.end)
            throw new Error("options.default should be in " + options.start + ".." + options.end);

        this.eventBus = new EventEmitter();
        /**
         * 버튼이 삭제됬을때 -> onDestroy 호출
         */
        this.eventBus.on('destroy', () => {
            this.onDestroy();
        });
        /**
         * 버튼이 눌렸을때 -> onClick 호출
         */
        this.eventBus.on('click', async (i, id) => {
            Logger.debug(i.id+" "+id);
            await this.onClick(i, id);
        });
    }

    /**
     * 외부에서 이벤트 실행시 불러오는 부분
     * this.message를 set
     */
    options(options: string | BaseMessageOptions): PagedButton {
        if (typeof options === "string")
            this.message = <BaseMessageOptions>{content: options as string}
        else
            this.message = options as BaseMessageOptions;

        return this;
    }

    async send(interaction: CommandInteraction | MessageComponentInteraction | Message, option?: boolean): Promise<InteractionResponse | Message> {
        /**
         * createButton에서 prev,inx,next 버튼
         */
        const row = new ActionRowBuilder()
            .addComponents(this.createButtons())

        if (this.message == null) //없을경우
            throw Error("Message should be provided with options() before send().");
        this.message.components = this.message.components
            ? [row as any].concat([...this.message.components])
            : [row as any];
        //components를 버튼으로 설정 -> this.message
        const res = await (
            option
                ? interaction.channel!!.send(this.message)
                : interaction instanceof Message
                    ? interaction.reply(this.message)
                    : interaction.deferred
                        ? interaction.editReply(this.message)
                        : interaction.reply(this.message)); //출력
        let collector; //createMessageComponentCollector
        /**
         * timer 후 distroy
         */
        if (this._options.destroy?.afterMillis ?? -1 === -1)
            collector = res.createMessageComponentCollector();
        else
            collector = res.createMessageComponentCollector({
                time: this._options.destroy?.afterMillis ?? -1
            });
        /**
         * Button이 바뀜을 감지했을 때
         */
        collector.on("collect", async i => {
            switch (i.componentType) {
                case ComponentType.Button:
                    /**
                     * 내부 eventEmitter의 click 이벤트를 불러옴
                     */
                    Logger.debug("커스텀아이디"+i.customId)
                    this.eventBus.emit("click", i, i.customId);
                    break;
            }
        });
        /**
         * 삭제되었을때 꺼버리는 함수
         */
        collector.on("end", async _ => {
            this.eventBus.emit(PagedButton.EVENT_DESTROY);
            if (this._options.destroy?.disableComponents && this.collector != null) {
                const orgMsg = await res.fetch();
                if (!orgMsg)
                    return;

                const newRows = orgMsg.components.map(row => {
                    const updatedRow = new ActionRowBuilder();
                    updatedRow.addComponents(
                        row.components.map(c => {
                            let newComponent;
                            switch (c.type) {
                                case ComponentType.Button:
                                    newComponent = ButtonBuilder.from(c);
                                    break;
                                default:
                                    return c;
                            }

                            newComponent.setDisabled(true);
                            return newComponent;
                        }) as any
                    );
                    return updatedRow;
                });

                await res.edit({
                    components: newRows as any
                });
            }
        })

        this.collector = collector;
        return res;
    }

    /**
     * 외부에서 이벤트 실행시 불러오는 부분
     */
    on(event: 'pageUpdate' | 'destroy', callback: (...args: any[]) => void): PagedButton {
        /**
         * pageUpdate 또는 destroy에 관한 event를 감지를 받았을때 callback 실행
         */
        this.eventBus.on(event, callback);
        return this;
    }

    /**
     * Click 시 현재 index를 가져오고 ID에서 prev일 경우 index-- or ++
     * eventBus로 PAGE_UPDATE를 넘겨주고 deferUpdate
     */

    private async onClick(interaction: ButtonInteraction, id: string) {
        let orgIdx = this.idx;
        let message = interaction.message;
        switch (id) {
            case PagedButton.ID_PREV:
                this.idx--;
                break;
            case PagedButton.ID_NEXT:
                this.idx++;
                break;
        }
        message = await message.edit({
            components: [new ActionRowBuilder().addComponents(this.createButtons()) as any]
        })
        this.eventBus.emit(PagedButton.EVENT_PAGE_UPDATE, message, orgIdx, this.idx);
        await interaction.deferUpdate();
    }

    private onDestroy() {
        this.eventBus.removeAllListeners();
        this.collector?.empty()
    }

    /**
     * prev, index, next 버튼 3개 혹은 index 없을 시 2개만 생성하여 array로 넘겨줌
     */
    private createButtons(): Array<ButtonBuilder> {
        const arr = [];

        const buttonPrev = new ButtonBuilder()
            .setCustomId(PagedButton.ID_PREV)
            .setLabel(this._options.label?.prev ?? "<")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(this.idx <= this._options.start)
        arr.push(buttonPrev)

        if (this._options.showIndex) {
            const buttonIdx = new ButtonBuilder()
                .setCustomId(PagedButton.ID_IDX)
                .setLabel((this._options.label?.index ?? `${PagedButton.KEY_INDEX}/${PagedButton.KEY_END}`)
                    .replace(PagedButton.KEY_INDEX, this.idx.toString())
                    .replace(PagedButton.KEY_END, this._options.end.toString())
                )
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
            arr.push(buttonIdx)
        }
        const buttonNext = new ButtonBuilder()
            .setCustomId(PagedButton.ID_NEXT)
            .setLabel(this._options.label?.next ?? ">")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(this.idx >= this._options.end)
        arr.push(buttonNext)

        return arr;
    }
}
