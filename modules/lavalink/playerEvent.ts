import { Queue } from "./manageQueue";


export class queueManager{
    private queue:Queue;

    constructor(queue:Queue){
        this.queue = queue;
    }

    public event(){
        this.queue!!.data!!.player!!.on("start",async ()=>{
            await this.queue!!.data!!.player!!.setVolume(this.queue.data.option.playVolume/1000);
        })
        this.queue!!.data!!.player!!.on("end",async ()=>{
            if(this.queue!!.data.option.playNextOption) await this.queue!!.next();
        })
        this.queue!!.data!!.player!!.on("stuck",async ()=>{
            if(this.queue!!.data.option.playNextOption) await this.queue!!.next();
        })
        this.queue!!.data!!.player!!.on("closed",console.error)
    }
}