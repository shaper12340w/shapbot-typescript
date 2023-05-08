import { EmbedBuilder } from "discord.js";

type colorType = "red" | "green" | "blue" | "yellow";

interface colorList{
    red:number;
    green:number;
    blue:number;
    yellow:number;
    [key: string]: number;
}

export function makeEmbed(title:string,description:string,color:number|colorType,notion?:number|string){
    
    const listColor:colorList = { red: 0xe01032, green: 0x36eb87, blue:0x426cf5, yellow:0xdbce39 }; //red,green,blue,yellow
    const listNotion = [":exclamation:","✅","❌",":speaker:","⏸️","▶️","⏹","⏭️"]
    let notionString:string|undefined;
    let colorString:number|undefined;
    if(notion){
        switch(typeof notion){
            case "string":
                notionString = notion;
                break;
            case "number":
                if(!listNotion[notion]) break;
                else notionString = listNotion[notion];
                break;
        }
    }
    switch(typeof color){
        case "string":
            if(!listColor[color]) break;
            else colorString = listColor[color];
            break;
        case "number":
            const objkey = Object.keys(listColor);
            if(!listColor[objkey[color]]) break;
            else colorString = listColor[objkey[color]];
            break;
    }
    const result = new EmbedBuilder().setTitle(title).setDescription(`${notionString ? notionString+" | " : ""}${description}`).setColor(colorString!!);
    return result;

}