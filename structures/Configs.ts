const configs = {
    bot:{
        showDebug:true,
        chatLog:false,
    },
    key:{
        discord:process.env.DISCORD_TOKEN!!,
        youtube:process.env.YOUTUBE_API!!,
        soundcloud:'',
        spotify:process.env.SPOTIFY_API!!,
        artiva:process.env.ARTIVA_API!!
    },
    id:{
        discord:process.env.CLIENT_ID!!,
        spotify:process.env.SPOTIFY_ID!!,
        server:process.env.GUILD_ID!!,
    },
    regex: {
        youtube: {
            YOUTUBE_BASE_URL: "https://www.youtube.com",
            YOUTUBE_VIDEO_URL: /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be.com\/\S*(?:watch|embed)(?:(?:(?=\/[-a-zA-Z0-9_]{11,}(?!\S))\/)|(?:\S*v=|v\/)))([-a-zA-Z0-9_]{11,})/,
            YOUTUBE_PLAYLIST_URL: /(?:youtube\.com\/watch\?.*?list=|youtube\.com\/playlist\?list=)([^&\s]+)/i,
            YOUTUBE_MUSIC_URL: /(?:https?:\/\/)?music\.youtube\.com\/(?:watch\?v=|v\/)([^&\s]+)/i,
        },
        spotify: /^(?:spotify:|https:\/\/[a-z]+\.spotify\.com\/(track\/|user\/(.*)\/playlist\/|playlist\/))(.*)$/,
        deezer: /^https?:\/\/(?:www\.)?deezer\.com\/[a-z]+\/(track|album|playlist)\/(\d+)$/,
        soundcloud: {
            SOUNDCLOUD_BASE_URL: "https://soundcloud.com",
            SOUNDCLOUD_API_VERSION: "/version.txt",
            SOUNDCLOUD_URL_REGEX: /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/,
            SOUNDCLOUD_KEYGEN_URL_REGEX: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            SOUNDCLOUD_API_KEY_REGEX: /(https:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            REGEX_TRACK: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/?$/,
            REGEX_SET: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/sets\/([A-Za-z0-9_-]+)\/?$/,
            REGEX_ARTIST: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/?$/,
            STREAM_FETCH_HEADERS: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36",
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br"
            },
            USER_URN_PATTERN: /soundcloud:users:(?<urn>\d+)/,
            STREAM_ERRORS: {
                "401": "Invalid ClientID",
                "404": "Track not found/requested private track"
            }
        },
        apple: /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/,
        nico: /^https?:\/\/(?:www\.|secure\.|sp\.)?nicovideo\.jp\/watch\/([a-z]{2}[0-9]+)/
    },
    lavalink: {
        option: {
            moveOnDisconnect: true,
            resume: true,
            resumeTimeout: 600,
            reconnectTries: Infinity,
            restTimeout: 3000
        },
        nodes:[
            {
                name: "localhost",
                url: "localhost:2333",
                auth: "shaper12340w"
            }
        ],
        rate:10,
        volume:100,
        platforms:{
            youtube:{
                emoji:"<:yt:1127872243813326898>",
                color:"#ef3b3b"
            },
            spotify:{
                emoji:"<:spot:1127871767323611176>",
                color:"#18e674"
            },
            nico:{
                emoji:"<:nico:1127871771752796187>",
                color:"#414141"
            },
            deezer:{
                emoji:"<:deez:1127871768804200468>",
                color:"#8088ff"
            }
        }
    },
    get:process.env
}

export = configs;