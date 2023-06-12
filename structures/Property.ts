import { promisify } from "util";
import * as fs from "fs";
import {exClient} from "./Client";
import { client } from "../app";
import { Guild } from "discord.js";


export type serverPropertyDataType = {
    player:{
        volume:string;
    }
    administrator?:string[];
    prefix:string;
    notice:string;
    inviteRoom:string;
}
export interface serverPropertyType{
    [key:string]:serverPropertyDataType
}


const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export class ManageProperty{
    public static async getFile(client:exClient){
        readFile("./db/data/files/serverProperty.json")
            .then(data=>{
                try{
                    const serverList = client.guilds.cache.map(e=>e.id);
                    const dataList:serverPropertyType = JSON.parse(String(data));
                    for (const key in dataList) {
                        if (!serverList.includes(key)) {
                            console.log(key + "의 서버가 삭제됨")
                        } else {
                            client.serverProperty.set(key,dataList[key])
                        }
                    }
                    console.log("property loaded");
                    console.log(client.serverProperty);

                } catch (e:unknown) {
                    if (e instanceof Error) {
                        throw new Error("파일을 불러올 수 없습니다!\n\n" + e.stack);
                    } else {
                        throw new Error("파일을 불러올 수 없습니다!");
                    }
                }

            })
            .catch(async ()=>{
                console.log("property not loaded");
                client.guilds.cache.forEach( (value:Guild,key:string)=>{
                    this.getProperty(key);
                })
                await this.saveProperty();
            })
    }
    public static async saveProperty(){
        const mapAsObject:serverPropertyType = {};
        for (const [key, value] of client.serverProperty) {
            mapAsObject[key] = value;
        }
        writeFile("./db/data/files/serverProperty.json",JSON.stringify(mapAsObject,null,3))
            .then(()=>console.log("property saved"))
            .catch(console.error);
    }
    public static async getProperty(id:string){
        const json:serverPropertyDataType = {
            player: {
                volume:"100"
            },
            prefix: "!",
            notice:'',
            inviteRoom:''
        };
        if(!client.serverProperty.has(id)){
            client.serverProperty.set(id,json);
        } else {
            client.serverProperty.forEach((value:serverPropertyDataType,key:string)=>{
                client.serverProperty.set(key,Object.assign({},client.serverProperty.get(key)))
            })
        }
    }

}