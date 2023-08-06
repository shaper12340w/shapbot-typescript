import { CreateGenerationRequest } from "./GenerationTypes";

export interface ImageToImageRequest extends CreateGenerationRequest {
    image: string,
}