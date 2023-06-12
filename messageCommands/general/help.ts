import { Message, AttachmentBuilder, APIEmbed } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { client } from "../../app";
import { createStringSelectMenuBuilder } from "../../modules/discord/interactions";
import * as fs from "fs";
import { MessageCommandData } from "../../structures/Client";

interface commandListData {
    name:string;
    description?:string;
    commands:string[];
}
export default new MessageCommand({
    data: {
        name: "help",
        duplicatedData:["도움말","명령어"],
        description: "도움말",
    },
    async execute(message:Message) {
        const commandList:commandListData[] = client.messageCommands.map((command:MessageCommandData) => {
            return {
                name:command.data.name,
                description:command.data.description,
                commands: command.data.duplicatedData ? command.data.duplicatedData : <string[]>[]
            }
        })
        const canCommandList = commandList.filter(e=>e.commands.length > 0);
        const embed:APIEmbed = {
            color: 0x426cf5,
            title: '샾봇 도움말',
            footer:{
                text: 'Made by SHAPER (tag:rplaz#6399)',
                icon_url: 'https://cdn.discordapp.com/avatars/457797236458258433/8721e17c0f6fc3e6879db74afcf20be3.webp'
            }
        }
        const prefix = client.serverProperty.get(message.guild!!.id)!!.prefix;
        const row = createStringSelectMenuBuilder({
            id:message.id,
            options:new Array(canCommandList.length).fill(0).map((_,i)=>{
                return { label : canCommandList[i].name, value: String(i) }
            }),
            async execute({ interaction }){
                const index = Number(interaction.values[0]);
                const list = canCommandList[index];
                const imgName = fs.readdirSync("./db/image/help").filter((item) => item.includes(list.name));
                const getImage = imgName.length === 1 ? fs.readFileSync(`./db/image/help/${imgName.join('')}`) : false;
                embed.description = `${prefix}${list.name} / ${list.commands.join(' / ')}\n\n${list.description!!.replace(/\[prefix\]/g,`${prefix}`).replace(/\[commands\]/g,`${list.commands.join(" / ")}`)}`
                if(getImage){
                    const file = new AttachmentBuilder(getImage, { name : imgName.join('')});
                    embed.image = { url:`attachment://${imgName.join('')}`}
                    interaction.reply({ephemeral:true, embeds:[embed],files:[file] })
                } else {
                    interaction.reply({ephemeral:true, embeds:[embed] })
                }


            }
        })
        embed.title = '샾봇 도움말';
        embed.description = canCommandList.map(e=>{ return `${prefix}${e.name} / ${e.commands.join(' / ')} : ${e.description}`}).join('\n'+"⎯".repeat(30)+'\n');
        message.reply({embeds:[embed],components:[row]})
    }
});