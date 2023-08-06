import * as fetch from "node-fetch"
import axios from "axios"
import * as configs from "../../structures/Configs"
import {Logger} from "../common/logger";
const Constants = configs.regex.soundcloud

//----------------------------------------------------------------
interface MediaFormat {
  protocol: string;
  mime_type: string;
}

interface Transcoding {
  url: string;
  preset: string;
  duration: number;
  snipped: boolean;
  format: MediaFormat;
  quality: string;
}

interface Media {
  transcodings: Transcoding[];
}

interface PublisherMetadata {
  id: number;
  urn: string;
  artist: string;
  album_title: string;
  contains_music: boolean;
  publisher: string;
  isrc: string;
  release_title: string;
}

interface User {
  avatar_url: string;
  first_name: string;
  followers_count: number;
  full_name: string;
  id: number;
  kind: string;
  last_modified: string;
  last_name: string;
  permalink: string;
  permalink_url: string;
  uri: string;
  urn: string;
  username: string;
  verified: boolean;
  city: string | null;
  country_code: string | null;
  badges: {
    pro: boolean;
    pro_unlimited: boolean;
    verified: boolean;
  };
  station_urn: string;
  station_permalink: string;
}

export interface SoundCloudTrack {
  artwork_url: string;
  caption: string | null;
  commentable: boolean;
  comment_count: number;
  created_at: string;
  description: string;
  downloadable: boolean;
  download_count: number;
  duration: number;
  full_duration: number;
  embeddable_by: string;
  genre: string;
  has_downloads_left: boolean;
  id: number;
  kind: string;
  label_name: string | null;
  last_modified: string;
  license: string;
  likes_count: number;
  permalink: string;
  permalink_url: string;
  playback_count: number;
  public: boolean;
  publisher_metadata: PublisherMetadata;
  purchase_title: string | null;
  purchase_url: string | null;
  release_date: string | null;
  reposts_count: number;
  secret_token: string | null;
  sharing: string;
  state: string;
  streamable: boolean;
  tag_list: string;
  title: string;
  track_format: string;
  uri: string;
  urn: string;
  user_id: number;
  visuals: string | null;
  waveform_url: string;
  display_date: string;
  media: Media;
  station_urn: string;
  station_permalink: string;
  track_authorization: string;
  monetization_model: string;
  policy: string;
  user: User;
}

//----------------------------------------------------------------
export class SoundcloudScrapper {

    constructor() {
    }
    static request(url: string, options: object) {
        return fetch.default(url, options);
    }

    static parseHTML(url: string, options?: object) {
        return new Promise((resolve) => {
            SoundcloudScrapper.request(url, {redirect: "follow", ...options})
                .then(res => res.text())
                .then(body => resolve(body))
                .catch(() => resolve(""));
        });
    }

    static keygen() {
        return new Promise(async resolve => {
            try {
                const html: String = await SoundcloudScrapper.parseHTML(Constants.SOUNDCLOUD_BASE_URL) as String;
                const res: string[] = html.split('<script crossorigin src="');
                const urls: string[] = [];
                let index: number = 0;
                let key;

                res.forEach(u => {
                    let url = u.replace('"></script>', "");
                    let chunk = url.split("\n")[0];
                    if (Constants.SOUNDCLOUD_KEYGEN_URL_REGEX.test(chunk)) {
                        urls.push(chunk);
                    }
                });

                while (index !== urls.length && !key) {
                    let url = urls[index];
                    index++;
                    if (Constants.SOUNDCLOUD_API_KEY_REGEX.test(url)) {
                        const data = await SoundcloudScrapper.parseHTML(url) as String;
                        if (data.includes(',client_id:"')) {
                            const a = data.split(',client_id:"');
                            key = a[1].split('"')[0];
                            console.log(key)
                            if (index === urls.length) {
                                return resolve(key);
                            }
                        }
                    }
                }

            } catch (e) {
                console.error(e)
                resolve(null);
            }
        });
    }

    static async findRelated(track_id: string) {
        if (configs.key.soundcloud.length === 0) configs.key.soundcloud = await SoundcloudScrapper.keygen() as string;
        Logger.debug(configs.key.soundcloud);
        const url = `https://api-v2.soundcloud.com/tracks/${track_id}/related`;
        const params = {
            client_id: configs.key.soundcloud,
            limit: 10,
            offset: 0,
            linked_partitioning: 1,
            app_version: '1689322736',
            app_locale: 'en'
        };
        const headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8',
            'Connection': 'keep-alive',
            'Host': 'api-v2.soundcloud.com',
            'Origin': 'https://soundcloud.com',
            'Referer': 'https://soundcloud.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.82',
            'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
        };

        return axios.get(url, {params, headers})
            .then(response => {
                Logger.debug(response.data)
                return response.data.collection as SoundCloudTrack[]
            })
            .catch(error => {
                Logger.error(error);
            });
    }

}
