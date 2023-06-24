import { Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import readdirp from "readdirp";
import * as path from "path";
import { config } from "dotenv";
config();

interface entr{
    fullPath: string,
    path: string,
}

//서버마다 각각 다르게 실행하도록 변경하기!
async function setSlashCommands(id?:string | number, option?:string []) {
    const token = process.env.DISCORD_TOKEN as string;
    const clientId = process.env.CLIENT_ID as string;
    const guildId = String(id);

    const rest = new REST({ version: '10' }).setToken(token);
    
    const options = ["game","general","music","test"].filter(e=>option?.includes(e));
    const commands = [];
    const commandsPath = "./commands";

    function fileRead() {
        const fileList:string [] = [];
        let finalpath:string;

        return new Promise<string []>((resolve, reject) => {
            function readjs(path:string) {
                readdirp(path, {
                    fileFilter: ["!*.d.ts","*.ts","*.js"],
                    type:"files"
                })
                    .on("data", (entry:entr) => {
                        fileList.push(entry.fullPath);
                    })
                    .on("error", (err:Error) => {
                        reject(err);
                    })
                    .on("end", () => {
                        if (fileList.length === 0) {
                            reject(new Error("No files found"));
                        } else {
                            resolve(fileList);
                        }
                    });
            }
            if(options.length === 0){
                readjs(commandsPath);
            } else {
                options.forEach((e,i)=>readjs(path.join(commandsPath,options[i])))
            }
            
        });
    }

    const commandFiles = await fileRead();
    for (const file of commandFiles) {
        const command = require(file).default;
        commands.push(command.data.toJSON());
    }
    if(id){
        rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => console.log('Command Set :'+id))
        .catch(console.error);
    } else {
        rest.put(Routes.applicationCommands(clientId), { body: commands })
        .then(() => console.log('Command Set : ALL'))
        .catch(console.error);
    }
    

}
export { setSlashCommands }

