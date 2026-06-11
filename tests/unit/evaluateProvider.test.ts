import { describe, expect, it } from "vitest";
import { evaluationProviderForEnv } from "@/src/lib/evaluate";

describe("evaluationProviderForEnv", () => {
  it("uses OpenAI first when no provider is forced", () => {
    expect(
      evaluationProviderForEnv({
        OPENAI_API_KEY: "openai-key",
        NVIDIA_API_KEY: "nvidia-key",
      }),
    ).toEqual({ provider: "openai", model: "gpt-5-mini" });
  });

  it("falls through to NVIDIA when only NVIDIA is configured", () => {
    expect(
      evaluationProviderForEnv({
        NVIDIA_API_KEY: "nvidia-key",
        NVIDIA_BASE_URL: "https://integrate.api.nvidia.com/v1/",
        NVIDIA_EVALUATION_MODEL: "nvidia/nvidia-nemotron-nano-9b-v2",
      }),
    ).toEqual({
      provider: "nvidia",
      baseURL: "https://integrate.api.nvidia.com/v1",
      model: "nvidia/nvidia-nemotron-nano-9b-v2",
    });
  });

  it("uses the fast NVIDIA JSON-capable model by default", () => {
    expect(
      evaluationProviderForEnv({
        NVIDIA_API_KEY: "nvidia-key",
      }),
    ).toEqual({
      provider: "nvidia",
      baseURL: "https://integrate.api.nvidia.com/v1",
      model: "meta/llama-3.1-8b-instruct",
    });
  });

  it("keeps forced NVIDIA on NVIDIA when OpenAI is also configured", () => {
    expect(
      evaluationProviderForEnv({
        SHIPCHECK_AI_PROVIDER: "nvidia",
        OPENAI_API_KEY: "openai-key",
        NVCF_RUN_KEY: "nvidia-key",
        NVIDIA_MODEL: "z-ai/glm-5.1",
      }),
    ).toMatchObject({
      provider: "nvidia",
      model: "z-ai/glm-5.1",
    });
  });

  it("rejects unsupported provider names", () => {
    expect(() => evaluationProviderForEnv({ SHIPCHECK_AI_PROVIDER: "claude" })).toThrow(
      'Unsupported SHIPCHECK_AI_PROVIDER "claude"',
    );
  });
});
