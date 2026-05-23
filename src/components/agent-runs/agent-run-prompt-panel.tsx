import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AgentRunPromptPanel({ prompt }: { prompt: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Original prompt</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm leading-6">
          {prompt}
        </pre>
      </CardContent>
    </Card>
  );
}
