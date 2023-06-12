import { Message,EmbedBuilder, ButtonInteraction } from 'discord.js';
import { MessageCommand } from '../../structures/Command'
import { playlistOption, queue } from '../../modules/lavalink/manageQueue';
import { promisify } from 'util';
import * as fs from "fs";
import { createButtonSet, createModal, createStringSelectMenuBuilder } from '../../modules/discord/interactions';
import { makeEmbed } from '../../modules/discord/manageEmbed';

type ArrData = {
    name:string;
    value:playlistOption[];
}

type ReturnData = (interaction:ButtonInteraction) => Promise<void>

type button = () => void;
const Buttons:button[] = [];
const killAll = () => Buttons.forEach(e=>{try{e()}catch(e:unknown){}});

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);


export default new MessageCommand({
	data: {
        name: "track",
        duplicatedData:["재생목록"],
        description: "재생목록을 관리합니다",
    },

	async execute(message:Message) {
        //재생목록이 없을 시
        if(!queue.get(message.guildId!!)){
            await message.reply({embeds:[new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")]})
        } else {
            killAll();
            const path:string = "./db/music/" //주소
            const nowPlayList:playlistOption[] = (<playlistOption[]>JSON.parse(JSON.stringify(queue.get(message.guildId!!)!!.data.playList))).map(e=>{e.status=1;return e}); //현재 큐의 재생목록

            const save:ReturnData = async function (interaction:ButtonInteraction) {
                createModal(interaction,{
                    title:"이름을 정해주세요",
                    inputs:[
                        {
                            label:"재생목록 이름",
                            length:[0,20],
                            placeholder:"재생목록 이름을 정해주세요",
                            required:true,
                            style:1
                        }
                    ]
                })
                .then(async ({ interaction, inputs }) => {
                    async function saveFile(name:string,value:playlistOption[],option?:boolean){
                        if(option) readFile(`${path}${interaction.user.id}.json`) // name : 재생목록 이름 | value: 재생목록 값 | option: 새로 저장할 지 여부
                        .then(async data=>{
                            const getData:Array<ArrData> = JSON.parse(String(data));
                            getData.push({name:name,value:value})
                            await writeFile(`${path}${interaction.user.id}.json`,JSON.stringify(getData,null,3));
                        })
                        .catch(()=>writeFile(`${path}${interaction.user.id}.json`,JSON.stringify([{name:name,value:value}],null,3))
                        .catch(console.error))
                        else writeFile(`${path}${interaction.user.id}.json`,JSON.stringify([{name:name,value:value}],null,3))
                        .catch(console.error)
                    }
                    const [value] = inputs;
                    readdir(path)
                    .then((files:string[])=>{
                        const index:string[] = files.filter(e=>e.includes(interaction.user.id+".json"))
                        if(index.length < 0) saveFile(value,nowPlayList);
                        else if(index.length > 14) interaction.reply("`저장된 재생목록이 너무 많습니다!`")
                        else saveFile(value,nowPlayList,true)
                        interaction.reply(`\`${value}으로 재생목록이 저장되었습니다\``)
                    })
                    .catch(console.error);
                })
                .catch(console.error);
                
            }

            const load:ReturnData = async function (interaction: ButtonInteraction) {
                const fileList: string[] = await readdir(path);
                const file: string | false = fileList.find(e => e.includes(interaction.user.id)) ?? false;
                if (!file) interaction.reply("`저장된 재생목록이 없습니다!`");
                else {
                    const list: ArrData[] = JSON.parse(String(await readFile(`${path}${interaction.user.id}.json`)))
                    const menu = createStringSelectMenuBuilder({
                        id: interaction.id,
                        options: list.map((e, i) => { return { label: e.name, value: String(i) } }),
                        async execute({ interaction }) {
                            const value = parseInt(interaction.values[0]);
                            if (!queue.get(interaction.guildId!!)) interaction.reply({ embeds: [new EmbedBuilder().setColor(0xe01032).setTitle(":exclamation: | 음악 재생 중이 아닙니다!")] })
                            else {
                                list[value].value.forEach(e=>queue.get(interaction.guildId!!)!!.data.playList.push(e));
                                await interaction.reply({ embeds:[makeEmbed("재생목록에 추가되었습니다", queue.get(interaction.guildId!!)!!.data.playList.map((e,i)=>"`"+String(i)+"` | "+e.name).join('\n'), "yellow", 1)!!]});
                            }
                        }
                    })
                    interaction.reply({ embeds:[makeEmbed("재생목록을 선택해 주세요",list.map((e,i)=>"`"+String(i+1)+"` | "+e.name).join("\n"),"yellow")], components:[menu]})
                }
            }

            const remove: ReturnData = async function (interaction: ButtonInteraction) {
                const fileList:string[] = await readdir(path);
                const file: string | false = fileList.find(e => e.includes(interaction.user.id)) ?? false;
                if (!file) interaction.reply("`저장된 재생목록이 없습니다!`");
                else {
                    const list: ArrData[] = JSON.parse(String(await readFile(`${path}${interaction.user.id}.json`)))
                    const menu = createStringSelectMenuBuilder({
                        id: interaction.id,
                        options: list.map((e, i) => { return { label: e.name, value: String(i) } }),
                        async execute({ interaction }) {
                            const value = parseInt(interaction.values[0]);
                            const name = list[value].name;
                            list.splice(value,1);
                            await writeFile(`${path}${interaction.user.id}.json`,JSON.stringify(list,null,3))
                            interaction.reply({ embeds: [makeEmbed("재생목록이 삭제되었습니다",`\`${name}\``, "red")!!] });

                        }
                    })
                    interaction.reply({ embeds: [makeEmbed("삭제할 목록을 선택해 주세요", list.map((e, i) => "`" + String(i+1) + "` | " + e.name).join("\n"), "red")], components: [menu] })
                }
            }

            const button = createButtonSet(message.id,[
                {
                    label: '저장',
                    style: 1,
                    async execute({ interaction,kill }) {
                        Buttons.push(kill);
                        if(queue.get(interaction.guildId!!))
                            await save(interaction);
                        else 
                            interaction.reply({ content:"재생 중이 아닙니다", ephemeral:true });
                    }
                },
                {
                    label: '로드',
                    style: 1,
                    async execute({ interaction,kill }) {
                        Buttons.push(kill);
                        if(queue.get(interaction.guildId!!))
                            await load(interaction);
                        else
                            interaction.reply({ content:"재생 중이 아닙니다", ephemeral:true });
                    }
                },
                {
                    label: '삭제',
                    style: 1,
                    async execute({ interaction,kill }) {
                        Buttons.push(kill);
                        if(queue.get(interaction.guildId!!))
                            await remove(interaction);
                        else 
                            interaction.reply({ content:"재생 중이 아닙니다", ephemeral:true });
                    }
                }
            ])

            await message.reply({ embeds:[makeEmbed("수행할 작업을 선택해주세요","저장: 현재 재생목록을 저장합니다\n로드: 현재 재생목록에 저장된 재생목록을 불러옵니다\n삭제: 저장된 재생목록을 삭제합니다","blue")], components:[button] });

        }
    }
})