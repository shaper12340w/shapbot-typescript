import { Event } from '../structures/Event'
import { ServerProperty } from "../structures/Property";
import { client } from '../app';
import {EmbedBuilder, Guild, GuildBasedChannel, PermissionsBitField, TextChannel} from "discord.js";

export default new Event({
    name: "guildCreate",
    async run(guild:Guild) {
        await ServerProperty.set(guild.id!!);
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('[shapbot invited]')
            .setThumbnail(client.user!!.displayAvatarURL())
            .setDescription("샾봇을 추가해주셔서 감사합니다!\n\n도움말 : [shapbot.kro.kr](http://shapbot.kro.kr)\n추가 서버 설정 명령어 : /settings")
            .setFooter({text:'자세한 것은 도움말을 참고해 주세요'});
        const option = (channel:GuildBasedChannel) => channel.permissionsFor(client.user!!)!!.has(PermissionsBitField.Flags.SendMessages)&&channel.type === 0
        const channel = guild.channels.cache.filter(option).first();
        (channel!! as TextChannel).send({embeds:[embed]}).catch(console.error);
    }
})