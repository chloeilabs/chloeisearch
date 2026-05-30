import { DetailSection } from "@/components/agent-runs/detail-section";

export function AgentRunPromptPanel({ prompt }: { prompt: string }) {
  return (
    <DetailSection title="Prompt">
      <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {prompt}
      </pre>
    </DetailSection>
  );
}
