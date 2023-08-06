import axios from "axios";
import {CreateGenerationRequest, GenerationResponse} from "./types/GenerationTypes";
import {UpscaleResponse, UpscaleType} from "./types/ImageUpscaleTypes";
import {ImageToImageRequest} from "./types/ImageToImageTypes";

const ARTIVA_URL = `https://artiva.kr`;

/**
 * Them main artiva class, this class should be viewed as the instance of an API key
 */
export class Artiva {

    private _apiKey: string;

    public constructor(apiKey: string) {
        this._apiKey = apiKey;
    }

    /**
     * Generate an image from a text prompt
     * @param generationRequest The generation parameters for the request
     */
    public generateText2Image(generationRequest: CreateGenerationRequest): Promise<GenerationResponse> {
        return new Promise(async (_r, _e) => {
            try {
                const response = await axios.post(`${ARTIVA_URL}/api/img/t2i`, generationRequest, {
                    headers: {
                        "artiva-api-key": this._apiKey
                    },
                    timeout: 1000 * 60
                })
                if (response.status != 200) {
                    return _e(new Error(`Api responded with ${response.status} ${response.statusText}`))
                }
                const responseJSON = await response.data;
                return _r(responseJSON as GenerationResponse);
            } catch (e) {
                return _e(e);
            }
        })
    }

    public generateImage2Image(generationRequest: ImageToImageRequest): Promise<GenerationResponse> {
        return new Promise(async (_r, _e) => {
            try {
                const response = await axios.post(`${ARTIVA_URL}/api/img/i2i`, generationRequest, {
                    headers: {
                        'artiva-api-key': this._apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 1000 * 60
                })

                if (response.status !== 200) {
                    throw new Error(`Api responded with ${response.status} ${response.statusText}`);
                }
                const responseJSON = await response.data;
                return _r(responseJSON as GenerationResponse);
            } catch (e) {
                return _e(e);
            }
        })
    }

    /**
     * Upscale image from a id
     * @param id The generation id for the request
     */
    public imageUpscale(id: String, type: UpscaleType): Promise<UpscaleResponse> {
        return new Promise(async (_r, _e) => {
            const response = await axios.post(`${ARTIVA_URL}/api/img/upscale`, {
                id: id,
                type: type
            }, {
                headers: {
                    "artiva-api-key": this._apiKey
                }
            })
            if (response.status != 200) {
                return _e(new Error(`Api responded with ${response.status} ${response.statusText}`))
            }
            const responseJSON = await response.data;
            return _r(responseJSON as UpscaleResponse);
        })
    }
}