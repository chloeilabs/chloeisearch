"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, Loader2Icon, PlayIcon, RefreshCwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  mergeRepositoryCatalogs,
  type RepositoryCatalogItem,
} from "@/lib/repositories/catalog";
import type { RunCreationLimits } from "@/lib/agent-runs/limit-policy";

type CursorModel = {
  id: string;
  displayName: string;
  description?: string;
};

type CursorRepository = {
  url: string;
};

type GitHubRepository = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  defaultBranch: string;
  url: string;
  pushedAt: string | null;
};

type GitHubBranch = {
  name: string;
  commitSha: string;
  protected: boolean;
};

type ApiErrorPayload = {
  error?: string;
};

export function NewAgentRunForm({
  runLimits,
}: {
  runLimits: RunCreationLimits;
}) {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [startingRef, setStartingRef] = useState("main");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [modelId, setModelId] = useState("");
  const [autoCreatePR, setAutoCreatePR] = useState(true);
  const [models, setModels] = useState<CursorModel[]>([]);
  const [repositories, setRepositories] = useState<RepositoryCatalogItem[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modelItems = useMemo(
    () => [
      { label: "Cursor account default", value: null },
      ...models.map((model) => ({
        label: model.displayName || model.id,
        value: model.id,
      })),
    ],
    [models]
  );

  function selectRepository(url: string) {
    setRepoUrl(url);

    const repository = repositories.find((item) => item.url === url);

    if (repository?.defaultBranch) {
      setStartingRef(repository.defaultBranch);
    }
  }

  const loadBranches = useCallback(async function loadBranches(
    repositoryUrl: string
  ) {
    setIsLoadingBranches(true);
    setBranchError(null);

    try {
      const params = new URLSearchParams({ repoUrl: repositoryUrl });
      const response = await fetch(`/api/github/branches?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json()) as ApiErrorPayload;
        throw new Error(payload.error ?? "Unable to load branches.");
      }

      const payload = (await response.json()) as { branches: GitHubBranch[] };
      setBranches(payload.branches);
    } catch (error) {
      setBranches([]);
      setBranchError(
        error instanceof Error ? error.message : "Unable to load branches."
      );
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  const loadCatalog = useCallback(async function loadCatalog() {
    setIsLoadingCatalog(true);
    setCatalogError(null);

    try {
      const [
        modelsResponse,
        githubRepositoriesResponse,
        cursorRepositoriesResponse,
      ] = await Promise.all([
        fetch("/api/cursor/models", { cache: "no-store" }),
        fetch("/api/github/repositories", { cache: "no-store" }),
        fetch("/api/cursor/repositories", { cache: "no-store" }),
      ]);

      if (!modelsResponse.ok) {
        const payload = (await modelsResponse.json()) as ApiErrorPayload;
        throw new Error(payload.error ?? "Unable to load Cursor models.");
      }

      const modelsPayload = (await modelsResponse.json()) as {
        models: CursorModel[];
      };
      setModels(modelsPayload.models);

      const repositoryErrors: string[] = [];
      let githubRepositories: GitHubRepository[] = [];
      let cursorRepositories: CursorRepository[] = [];

      if (githubRepositoriesResponse.ok) {
        const repositoriesPayload = (await githubRepositoriesResponse.json()) as {
          repositories: GitHubRepository[];
        };
        githubRepositories = repositoriesPayload.repositories;
      } else {
        const payload =
          (await githubRepositoriesResponse.json()) as ApiErrorPayload;
        repositoryErrors.push(
          payload.error ?? "Unable to load repositories from GitHub."
        );
      }

      if (cursorRepositoriesResponse.ok) {
        const repositoriesPayload = (await cursorRepositoriesResponse.json()) as {
          repositories: CursorRepository[];
        };
        cursorRepositories = repositoriesPayload.repositories;
      } else {
        const payload =
          (await cursorRepositoriesResponse.json()) as ApiErrorPayload;
        repositoryErrors.push(
          payload.error ?? "Unable to load Cursor-connected repositories."
        );
      }

      const mergedRepositories = mergeRepositoryCatalogs(
        githubRepositories,
        cursorRepositories
      );
      setRepositories(mergedRepositories);

      setRepoUrl((currentRepoUrl) => {
        if (currentRepoUrl || mergedRepositories.length === 0) {
          return currentRepoUrl;
        }

        const repository =
          mergedRepositories.find((item) => !item.archived) ??
          mergedRepositories[0];

        if (repository.defaultBranch) {
          setStartingRef(repository.defaultBranch);
        }

        return repository.url;
      });

      if (repositoryErrors.length > 0) {
        setCatalogError(repositoryErrors.join(" "));
      }
    } catch (error) {
      setCatalogError(
        error instanceof Error ? error.message : "Unable to load Cursor catalog."
      );
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(), 0);

    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  useEffect(() => {
    if (!repoUrl) {
      const timer = window.setTimeout(() => {
        setBranches([]);
        setBranchError(null);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => void loadBranches(repoUrl), 0);

    return () => window.clearTimeout(timer);
  }, [loadBranches, repoUrl]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          startingRef,
          taskPrompt,
          modelId: modelId || undefined,
          autoCreatePR,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create run.");
      }

      router.push(`/runs/${payload.run.id}`);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to create run."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="rounded-lg border bg-card p-5">
        <FieldSet>
          <FieldGroup>
            <RepoInput
              repoUrl={repoUrl}
              setRepoUrl={selectRepository}
              repositories={repositories}
            />
            <StartingRefInput
              startingRef={startingRef}
              setStartingRef={setStartingRef}
              branches={branches}
              isLoadingBranches={isLoadingBranches}
              branchError={branchError}
            />
            <PromptTextarea
              taskPrompt={taskPrompt}
              setTaskPrompt={setTaskPrompt}
            />
          </FieldGroup>
        </FieldSet>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-lg border bg-card p-5">
          <FieldSet>
            <FieldGroup>
              <ModelSelector
                items={modelItems}
                modelId={modelId}
                setModelId={setModelId}
                isLoading={isLoadingCatalog}
              />
              <AutoCreatePRToggle
                checked={autoCreatePR}
                setChecked={setAutoCreatePR}
              />
            </FieldGroup>
          </FieldSet>
        </div>

        <RunSafetyPanel runLimits={runLimits} />

        {catalogError ? (
          <Alert>
            <AlertCircleIcon data-icon="inline-start" />
            <AlertTitle>Cursor catalog unavailable</AlertTitle>
            <AlertDescription>{catalogError}</AlertDescription>
          </Alert>
        ) : null}

        {submitError ? (
          <Alert>
            <AlertCircleIcon data-icon="inline-start" />
            <AlertTitle>Run creation failed</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        {!runLimits.canCreateRun ? (
          <Alert variant="destructive">
            <AlertCircleIcon data-icon="inline-start" />
            <AlertTitle>Run creation paused</AlertTitle>
            <AlertDescription>{runLimits.reasons.join(" ")}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || !runLimits.canCreateRun}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <PlayIcon data-icon="inline-start" />
            )}
            Start cloud run
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void loadCatalog()}
            disabled={isLoadingCatalog}
            aria-label="Refresh Cursor catalog"
          >
            <RefreshCwIcon className={isLoadingCatalog ? "animate-spin" : ""} />
          </Button>
        </div>
      </aside>
    </form>
  );
}

function RunSafetyPanel({ runLimits }: { runLimits: RunCreationLimits }) {
  const items = [
    {
      label: "Active runs",
      value: formatLimit(
        runLimits.activeRuns,
        runLimits.activeLimit,
        runLimits.remainingActiveRuns
      ),
    },
    {
      label: "Runs in 24h",
      value: formatLimit(
        runLimits.runsLast24Hours,
        runLimits.dailyLimit,
        runLimits.remainingRunsLast24Hours
      ),
    },
    {
      label: "Per-minute actions",
      value: `${runLimits.perMinuteLimit.toLocaleString()} / user`,
    },
  ];

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Run safety</h2>
        <span className="text-xs text-muted-foreground">
          {runLimits.canCreateRun ? "Available" : "Limit reached"}
        </span>
      </div>
      <dl className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-medium tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatLimit(count: number, limit: number | null, remaining: number | null) {
  if (limit === null) {
    return `${count.toLocaleString()} / off`;
  }

  return `${count.toLocaleString()} / ${limit.toLocaleString()} (${remaining?.toLocaleString() ?? 0} left)`;
}

export function RepoInput({
  repoUrl,
  setRepoUrl,
  repositories,
}: {
  repoUrl: string;
  setRepoUrl: (value: string) => void;
  repositories: RepositoryCatalogItem[];
}) {
  const selectedRepository = repositories.find(
    (repository) => repository.url === repoUrl
  );

  if (repositories.length === 0) {
    return (
      <Field>
        <FieldLabel htmlFor="repo-url">Repository URL</FieldLabel>
        <Input
          id="repo-url"
          placeholder="https://github.com/acme/web"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          required
        />
        <FieldDescription>
          GitHub repositories could not be loaded automatically. Enter a valid
          repository URL as a fallback.
        </FieldDescription>
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel htmlFor="repo-url">Repository</FieldLabel>
      <Select
        value={repoUrl || null}
        onValueChange={(value) => {
          if (typeof value === "string") {
            setRepoUrl(value);
          }
        }}
      >
        <SelectTrigger id="repo-url" className="h-auto min-h-8 w-full">
          <SelectValue>
            {(value: string | null) => {
              const repository = repositories.find(
                (item) => item.url === value
              );

              return repository?.label ?? "Select a GitHub repository";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" className="max-h-80">
          <SelectGroup>
            <SelectLabel>Your GitHub repositories</SelectLabel>
            {repositories.map((repository) => (
              <SelectItem key={repository.url} value={repository.url}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium">
                    {repository.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {repository.defaultBranch
                      ? `${repository.defaultBranch} branch`
                      : "Repository URL"}
                    {repository.private ? " / Private" : ""}
                    {repository.cursorConnected ? " / Cursor connected" : ""}
                    {repository.archived ? " / Archived" : ""}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>
        Repositories are loaded from your signed-in GitHub account.
        {selectedRepository?.cursorConnected
          ? " This repository is also connected in Cursor."
          : ""}
      </FieldDescription>
    </Field>
  );
}

export function StartingRefInput({
  startingRef,
  setStartingRef,
  branches,
  isLoadingBranches,
  branchError,
}: {
  startingRef: string;
  setStartingRef: (value: string) => void;
  branches: GitHubBranch[];
  isLoadingBranches: boolean;
  branchError: string | null;
}) {
  if (branches.length > 0) {
    return (
      <Field>
        <FieldLabel htmlFor="starting-ref">Starting branch</FieldLabel>
        <Select
          value={startingRef || null}
          onValueChange={(value) => {
            if (typeof value === "string") {
              setStartingRef(value);
            }
          }}
        >
          <SelectTrigger id="starting-ref" className="w-full">
            <SelectValue>
              {(value: string | null) => value ?? "Select a branch"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start" className="max-h-80">
            <SelectGroup>
              <SelectLabel>Branches</SelectLabel>
              {branches.map((branch) => (
                <SelectItem key={branch.name} value={branch.name}>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium">{branch.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {branch.commitSha.slice(0, 7)}
                      {branch.protected ? " / Protected" : ""}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>
          Branches are loaded from the selected GitHub repository.
        </FieldDescription>
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel htmlFor="starting-ref">Starting ref</FieldLabel>
      <Input
        id="starting-ref"
        value={startingRef}
        onChange={(event) => setStartingRef(event.target.value)}
        required
      />
      <FieldDescription>
        {isLoadingBranches
          ? "Loading branches from GitHub..."
          : "Branch, tag, or commit ref where Cursor should begin."}
      </FieldDescription>
      {branchError ? <FieldError>{branchError}</FieldError> : null}
    </Field>
  );
}

export function PromptTextarea({
  taskPrompt,
  setTaskPrompt,
}: {
  taskPrompt: string;
  setTaskPrompt: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="task-prompt">Task prompt</FieldLabel>
      <Textarea
        id="task-prompt"
        value={taskPrompt}
        onChange={(event) => setTaskPrompt(event.target.value)}
        placeholder="Describe the code change, tests to update, and any constraints Cursor should follow."
        className="min-h-72 resize-y"
        required
        maxLength={20_000}
      />
      <FieldDescription>
        {taskPrompt.length.toLocaleString()} / 20,000 characters
      </FieldDescription>
    </Field>
  );
}

export function ModelSelector({
  items,
  modelId,
  setModelId,
  isLoading,
}: {
  items: Array<{ label: string; value: string | null }>;
  modelId: string;
  setModelId: (value: string) => void;
  isLoading: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="model-id">Model</FieldLabel>
      <Select
        items={items}
        value={modelId || null}
        onValueChange={(value) =>
          setModelId(typeof value === "string" ? value : "")
        }
        disabled={isLoading}
      >
        <SelectTrigger id="model-id" className="w-full">
          <SelectValue>
            {(value: string | null) =>
              value
                ? items.find((item) => item.value === value)?.label
                : "Cursor account default"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem
                key={item.value === null ? "cursor-account-default" : `model:${item.value}`}
                value={item.value}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>
        Models are discovered with Cursor.models.list for this API key.
      </FieldDescription>
      {items.length === 1 && !isLoading ? (
        <FieldError>No models were returned by Cursor.</FieldError>
      ) : null}
    </Field>
  );
}

export function AutoCreatePRToggle({
  checked,
  setChecked,
}: {
  checked: boolean;
  setChecked: (value: boolean) => void;
}) {
  return (
    <Field orientation="horizontal">
      <Switch
        id="auto-create-pr"
        checked={checked}
        onCheckedChange={(value) => setChecked(Boolean(value))}
      />
      <FieldContent>
        <FieldLabel htmlFor="auto-create-pr">Auto-create PR</FieldLabel>
        <FieldDescription>
          Ask Cursor to open a pull request when the run completes.
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}
