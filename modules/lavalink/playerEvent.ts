import { Queue, queue } from "./manageQueue";


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
                console.error(err);
            }
        }
    }

    public event():void {
        this.queue!!.data!!.player!!.on("start",async ()=>{
            await this.queue!!.data!!.player!!.setVolume(this.queue.data.option.playVolume/1000);
        })
        this.queue!!.data!!.player!!.on("end",async ()=>{


            await this.nextPlay();
        })
        this.queue!!.data!!.player!!.on("stuck",async ()=>{
            await this.nextPlay();
        })
        this.queue!!.data!!.player!!.on("closed",console.error)
    }
}