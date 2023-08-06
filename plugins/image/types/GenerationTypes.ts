import { JobStatus, AspectRatio, ArtivaModel, Sampler } from "./GeneralTypes";


export interface CreateGenerationRequest {
    model: ArtivaModel,
    prompt: string,
    negative_prompt?: string,
    steps: number,
    cfg_scale?: number,
    clip_skip?: boolean,
    seed?: number,
    scheduler?: Sampler,
    karras?: boolean,
    aspect_ratio?: AspectRatio,
    title?: string,
    desc?: string
}

export interface ResponseParamType {
    prompt: string,
    negative_prompt: string,
    seed: Number,
    cfg: Number,
    clip_skip: Boolean,
    aspect_ratio: AspectRatio,
    scheduler: Sampler,
    karras: Boolean,
    step: Number,
    model: ArtivaModel
}

export interface GenerationResponse {
    /**
     * The id of the job that has been created
     */
    id: string,

    /**
     * The current status of the job that has been created
     */
    status: JobStatus,

    /**
     * A list of parameters that had been used t ocreate the job
     */
    params: ResponseParamType,

    /**
     * The URL of the generated image
     */
    imgUrl: string | undefined,

    /**
     * The ogURL of the generated image
     */
    ogUrl: string | undefined,
}