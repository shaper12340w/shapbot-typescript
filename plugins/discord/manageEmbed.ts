import {ColorResolvable, EmbedBuilder} from "discord.js";

type colorType = "red" | "green" | "blue" | "yellow";

interface colorList {
    red: number;
    green: number;
    blue: number;
    yellow: number;

    [key: string]: number;
}

interface ListEmbedOptions {
    title: string;
    subtitle?:string;
    list:string[];
    chunkNumber?:number;
    color?: ColorResolvable | null;
    showIndex?: boolean;
}

export function makeEmbed(title: string, description: string, color: number | colorType, notion?: number | string) {

    const listColor: colorList = {red: 0xe01032, green: 0x36eb87, blue: 0x426cf5, yellow: 0xdbce39}; //red,green,blue,yellow
    const listNotion = [":exclamation:", "✅", "❌", ":speaker:", "⏸️", "▶️", "⏹", "⏭️"]
    let notionString: string | undefined;
    let colorString: number | undefined;
    if (notion) {
        switch (typeof notion) {
            case "string":
                notionString = notion;
                break;
            case "number":
                if (!listNotion[notion]) break;
                else notionString = listNotion[notion];
                break;
        }
    }
    switch (typeof color) {
        case "string":
            if (!listColor[color]) break;
            else colorString = listColor[color];
            break;
        case "number":
            const objkey = Object.keys(listColor);
            if (!listColor[objkey[color]]) break;
            else colorString = listColor[objkey[color]];
            break;
    }
    const result = new EmbedBuilder().setTitle(`${notionString ? notionString + " | " : ""}${title}`).setDescription(description).setColor(colorString!!);
    return result;

}

export class createListEmbeds {
    private chunkSize: number;
    private data: ListEmbedOptions;

    constructor(data: ListEmbedOptions) {
        this.chunkSize = data.chunkNumber ?? 10;
        this.data = data;
    }

    public static chunkArray(array: any[], chunkSize: number) {
        const chunks: any[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    public create() {
        const chunkedArray = createListEmbeds.chunkArray(this.data.list, this.chunkSize);
        const chunkedEmbeds = chunkedArray.map((e, i) => {
            const list = e.map((_e, _i) => `${this.data.showIndex ? String((i * this.chunkSize) + _i)+". ":" "}${_e}`);
            if (this.data.subtitle) list.unshift(this.data.subtitle,"");
            return new EmbedBuilder()
                .setTitle(this.data.title)
                .setColor(this.data.color ?? "#8088ff")
                .setDescription(list.join('\n'));
        });
        return chunkedEmbeds;
    }
}