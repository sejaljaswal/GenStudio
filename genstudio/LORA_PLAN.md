# LORA_PLAN.md - Custom LoRA Implementation Plan

## 1. TRAINING PIPELINE
**Data Upload:**
Users upload a dataset of 10-20 high-quality images. The frontend forces compression/resizing (max 1024x1024, JPEG/PNG) before uploading to a temporary AWS S3 bucket via presigned URLs. The upload request includes a trigger word (e.g., `[my_style]`).

**Training Trigger:**
A Next.js API route (`POST /api/loras/train`) validates the S3 references and calls `fal.queue.submit("fal-ai/flux-lora-fast-training")`. Payload:
```json
{ "images_data_url": "s3://temp-bucket/user_id/dataset.zip", "trigger_word": "[my_style]" }
```

**Job Tracking & Cost:**
The `/api/loras/train` endpoint returns a `falRequestId` which is stored in a new `LoraModel` database row. A dedicated CRON job or webhook endpoint (`POST /api/webhooks/fal-lora`) tracks status.
*Compute Cost:* ~15-30 minutes per job, roughly $0.50 - $1.50 per training run on Fal.

## 2. STORAGE & SCHEMA
**Weight Storage:**
By default, Fal hosts output `.safetensors` files for 30 days. To ensure persistence, our webhook downloads the output `safetensors` and pushes it to our permanent Cloudflare R2 bucket.

**Schema Additions:**
```prisma
model LoraModel {
  id           String   @id @default(cuid())
  name         String
  triggerWord  String
  status       String   // pending, processing, completed, failed
  falRequestId String?
  weightsUrl   String?  // R2 storage URL
  userId       String
  createdAt    DateTime @default(now())
}

// Update Generation model
model Generation {
  // ... existing fields
  loraId       String?
  loraScale    Float?   @default(1.0)
  lora         LoraModel? @relation(fields: [loraId], references: [id])
}
```

## 3. SERVING / INFERENCE
**Inference Trigger:**
In `app/api/generate/route.ts`, if `loraId` exists in the request body, we query the `LoraModel` to fetch `weightsUrl` and `triggerWord`.

**Fal Inference Call:**
We modify the `fal-ai/flux/schnell` (or `dev`) queue payload to include `loras`:
```javascript
{
  prompt: `${triggerWord} ${prompt}`,
  loras: [{ path: weightsUrl, scale: loraScale }]
}
```
**Versioning:** 
Retraining creates a completely new `LoraModel` ID. If a user deletes or retrains, old generated images retain the history via the original `loraId` foreign key (configured with `onDelete: SetNull`).

## 4. UX FLOW
1. **Dataset Creation:** User clicks "Train New Style", inputs a name, and uploads 10-20 images via dropzone.
2. **Processing:** They hit "Train". A persistent dashboard banner states "Training [StyleName]... (~20 mins)".
3. **Completion:** Upon webhook success, the UI pushes a toast notification and email alert.
4. **Usage:** `GenerateForm.tsx` gains a "Styles (LoRAs)" dropdown. Selecting one automatically injects the trigger word into the prompt context and adds a small badge to the form.
5. **Gallery Integration:** `GenerationCard` displays a `badge` showing the LoRA name if `loraId` exists. Clicking it filters the gallery to only show that style.

## 5. TRADEOFFS & LIMITATIONS
- **v1 Cuts:** No multi-LoRA mixing, no advanced hyperparameter tuning (learning rate, epochs). We hardcode sensible defaults on the Fal API.
- **Cost Scaling:** At $1.00+ per training run, free tiers cannot include training. LoRA generation must be paywalled or heavily metered (e.g., Stripe credit system).
- **Privacy Constraints:** User data deletion pipelines must be strict. If a user requests deletion, both the training dataset in S3 and the finalized `.safetensors` in R2 must be purged immediately to comply with GDPR/CCPA. 
- **Compute Cold Starts:** LoRAs inject latency into the first inference call as the weights are loaded into VRAM. Anticipate +5s latency on cold hits.
