import { Event } from '../structures/Event'
import { welcomeImage } from "../plugins/discord/welcomeImage";
import { client } from '../app';
import {GuildBasedChannel, GuildMember, PermissionsBitField, TextChannel} from "discord.js";
import {ServerProperty} from "../structures/Property";

export default new Event({
    name: "guildMemberAdd",
    async run(member:GuildMember) {
        const inviteRoom = (await ServerProperty.get(member.guild.id))!!.inviteRoom;
        if(inviteRoom.length > 0){
            const link = "https://cdn.pixabay.com/photo/2016/05/24/16/48/mountains-1412683_960_720.png";
            const memberImage = member.displayAvatarURL({ extension: 'png' , size :4096 });
            const wlimg = await welcomeImage(member.user.username,memberImage,link)
            const sendChannel = member.guild.channels.cache.get(inviteRoom)!! as TextChannel;
            if(!sendChannel){
                const option = (channel:GuildBasedChannel) => channel.permissionsFor(client.user!!)!!.has(PermissionsBitField.Flags.SendMessages)&&channel.type === 0
                const channel = member.guild.channels.cache.filter(option).first()!! as TextChannel;
                channel.send({ files:[{attachment:wlimg,name:"asdf.png"}]});
            } else {
                sendChannel.send({ files:[{attachment:wlimg,name:"asdf.png"}]});
            }
        }
    }
})