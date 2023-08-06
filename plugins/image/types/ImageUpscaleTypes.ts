import { JobStatus } from "./GeneralTypes";

export interface UpscaleResponse {
    /**
     * The current status of the job that has been upscale
     */
    status: JobStatus,
}


export enum UpscaleType {
    ESRGAN = "esrgan",
    ESRGAN_ANIME = "esrgan-anime",
    GFPGAN = "gfpgan"
}