import { Queue, queue } from "./manageQueue";
import { Logger } from "../common/logger";
import {ServerProperty} from "../../structures/Property";

export class queueManager{
    private queue:Queue;
    private guildId:string;

    constructor(queue:Queue){
        this.queue = queue;
        this.guildId = queue.guildId;
    }

    private async nextPlay():Promise<void>{
        console.log(queue.get(this.guildId)!!.data.option.playNextOption)
        this.queue!!.data!!.killList.forEach(e=>e());
        this.queue!!.data!!.killList = [];
        clearTimeout(this.queue.data.timer);
        this.queue!!.data!!.timer = undefined;
        if(!queue.get(this.guildId)!!.data.option.playNextOption) queue.get(this.guildId)!!.data.option.playNextOption = true;
        else {
            await this.queue!!.next()
            try{
                queue.get(this.guildId)!!.data.killList.forEach(e=>e());
            } catch(err:unknown){
                Logger.error(err);
            }
        }
    }

    public event():void {
        this.queue!!.data!!.player!!.on("start",async ()=>{
            this.queue.data.option.playVolume = Number((await ServerProperty.get(this.guildId))!!.player_volume);
            await this.queue!!.data!!.player!!.setFilterVolume(this.queue.data.option.playVolume/100);
        })
        this.queue!!.data!!.player!!.on("end",async ()=>{
            await this.nextPlay();
        })
        this.queue!!.data!!.player!!.on("stuck",async ()=>{
            await this.nextPlay();
        })
        this.queue!!.data!!.player!!.on("closed",e=>{
            this.queue.stop();
            Logger.warn(e)
        })
    }
}