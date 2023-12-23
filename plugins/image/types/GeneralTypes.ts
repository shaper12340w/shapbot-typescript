/**
 * A valid Artiva Model
 */
export enum ArtivaModel {

    /**
     * @modelType ckpt
     */
    DARK_SUSHI_MIX = "DarkSushiMix",

    /**
     * @modelType ckpt
     */
    ANYTHING_V5 = "AnythingV5",

    /**
     * @modelType ckpt
     */
    SD_V21 = "StableDiffusionV2.1",

    /**
     * @modelType ckpt
     */
    MEINAMIX_V10 = "MeinaMixV10",

    /**
     * @modelType ckpt
     */
    PASTEL_DREAM = "PastelDream",

    /**
     * @modelType safetensors
     */
    GHOST_MIX_V2 = "GhostMixV2",

    /**
     * @modelType safetensors
     */
    OPENJOURNEY_V4 = "OpenJourney",

    /**
     * @modelType safetensors
     */
    MEINA_PASTEL = "MeinaPastel",

    /**
     * @modelType ckpt
     */
    MEINA_UNREAL = "MeinaUnreal",

    /**
     * @modelType safetensors
     */
    ABSOLUTE_REALITY = "AbsoluteReality",
    
    /**
     * @modelType safetensors
     */
    BRA_V5 = "BraV5",

    /**
     * @modelType ckpt
     */
    DREAM_SHAPER_V7 = "DreamShaperV7",

    /**
     * @modelType ckpt
     */
    ICBINP = "ICBINP",

    /**
     * @modelType safetensors
     */
    LYRIEL = "Lyriel",

    /**
     * @modelType safetensors
     */
    MAJIC_MIX = "MajicMix",

    /**
     * @modelType safetensors
     */
    XXMIX = "Xxmix",

    /**
     * @modelType safetensors
     */
    TOON_YOU_V5 = "ToonYouV5",

    /**
     * @modelType safetensors
     */
    NIJI_JOURNEY = "NijiJourney",

    /**
     * @modelType safetensors
     */
    SDXL = "SDXL",
    /**
     * @modelType safetensors
     */
    MAJIC_MIX_V2 = "MajicMixV2",

    PERFECT_WORLD_V5 = "PerfectWorldV5",

    SDVN5_3DCuteWave = "SDVN5-3DCuteWave",

    DREAM_SHAPER_SDXL = "DreamShaperBeta",

    MEINAMIX_V11 = "MeinaMixV11"
}

/**
 * The type of Stable Diffusion sampler
 */
export enum Sampler {
    DDIM = "ddim",
    DDPM = "ddpm",
    EULER = "euler",
    EULERA = "eulera",
    KDPM2 = "kdpm2",
    DPM_SDE = "dpm_sde",
    DPMM = "dpmm"
}

/**
 * The aspect ratio of an image
 */
export enum AspectRatio {
    /**
     * @size 512x768
     */
    PORTRAIT = "portrait",

    /**
     * @size 768x512
     */
    LANDSCAPE = "landscape",

    /**
     * @size 512x512
     */
    SQUARE = "square"
}

export enum JobStatus {
    ERROR = `error`,
    SUCCEEDED = `succeeded`,
}

