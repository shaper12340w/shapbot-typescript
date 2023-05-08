import { Track } from "shoukaku";
import * as playdl from "play-dl";
import { CompareString } from "../common/compare";
import { playlistOption } from "./manageQueue";

const delay = (ms:number) => {
    return new Promise((resolve)=>{
       setTimeout(resolve,ms);
    });
 }

export class CompareVideo extends CompareString{
    constructor(){
        super()
    }
    private youtubeURI(uri:string):string | boolean {
        const pattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)?([A-Za-z0-9_-]{11})/;
        const match = uri.match(pattern);
        if (match) {
            const videoId = match[1];
            return videoId;
        } else {
            return false
        }
    }
    public async getRecommend(track:Track,list:playlistOption[]):Promise<string> {
        let comp;
        let vidinfo;
        let ind = 0;
        const getfirstInf = await playdl.video_basic_info(track.info.uri);
        do{
            try{
                const recVidUrl = getfirstInf.related_videos[ind];
                await delay(500)
                const getInfo = await playdl.video_basic_info(recVidUrl);
                vidinfo = getInfo.video_details.toJSON();
                comp = this.compareVideoRaw(getfirstInf.video_details.toJSON(),vidinfo);
                const urlList = list.map(e=>this.youtubeURI(e.url));
                if(urlList.includes(vidinfo.id!!)) comp = 1;
                ind ++;
                console.log("제목 : "+vidinfo.title);
                console.log("시간 : "+vidinfo.durationRaw);
                console.log("유사도 : "+comp+"\n");
            } catch(e){
                const recVidUrl = getfirstInf.related_videos[0];
                await delay(500)
                const getInfo = await playdl.video_basic_info(recVidUrl);
                vidinfo = getInfo.video_details.toJSON();
            }
        } while (Number(comp) > 0.75)
        return vidinfo.url;
    }
    public compareVideo(newTrack:Track,playlist:playlistOption[]):number{
        let accurate:number = 0;
        const playlistTrack = playlist.map(e=>e.track)
        const playlistName = playlist.map(e=>e.name)
        accurate += this.compare(newTrack.track,playlistTrack);
        accurate += this.compare(newTrack.info.title,playlistName)
        accurate += (Math.round(newTrack.info.length/1000) > 3600) ? 1:0
        return accurate;
    }
    private compareVideoRaw(data1:playdl.VideoOptions,data2:playdl.VideoOptions){
        const checkData1 = Object.keys(data1) ? Object.keys(data1).includes("id") : false;
        const checkData2 = Object.keys(data2) ? Object.keys(data2).includes("id") : false;
        if(checkData1&&checkData2){
            if(data1.id === data2.id || data2.durationInSec >= 3600){
                return 1.0
            } if(data1.title!!.includes(data2.title!!)){
                return 0.8
            }else {
                return this.similarity(data1.title!!,data2.title!!)
            }

        } else {
          return 0;
        }
    }
}