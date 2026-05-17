export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface Generation {
  id: string;
  prompt: string;
  negativePrompt: string | null;
  width: number | null;
  height: number | null;
  steps: number | null;
  seed: number | null;
  status: GenerationStatus;
  imageUrl: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  parentId?: string;
}

export interface GenerateResponse {
  generationId: string;
}
