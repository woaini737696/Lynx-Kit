import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Textarea,
  Label,
  Badge,
} from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { useBuild } from "@/hooks/use-build";

/** 澄清问题类型 */
export type QuestionType = "single" | "multiple" | "text" | "boolean";

export interface ClarificationQuestion {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

interface ClarificationFormProps {
  sessionId: string;
  questions: ClarificationQuestion[];
}

/**
 * 动态澄清表单
 *
 * 基于 React Hook Form + Zod，根据 ③ CLARIFY Agent 返回的问题列表动态渲染
 * （单选 / 多选 / 文本 / 布尔）。提交后写入配置并跳转构建控制台。
 */
export function ClarificationForm({
  sessionId,
  questions,
}: ClarificationFormProps) {
  const navigate = useNavigate();
  const { updateConfig, isUpdating } = useBuild();

  // 动态构建 Zod schema
  const schema = React.useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const q of questions) {
      let field: z.ZodTypeAny;
      switch (q.type) {
        case "single":
          field = z.string().min(1, "请选择一项");
          break;
        case "multiple":
          field = z.array(z.string()).min(1, "至少选择一项");
          break;
        case "boolean":
          field = z.boolean();
          break;
        case "text":
        default:
          field = z.string().min(q.required ? 1 : 0, "不能为空");
      }
      shape[q.id] = q.required === false ? field.optional() : field;
    }
    return z.object(shape);
  }, [questions]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      await updateConfig({
        sessionId,
        patch: values,
        confirmClarify: true,
      });
      toast({ title: "配置已确认，开始构建", variant: "success" });
      navigate(`/build/${sessionId}?tab=console`);
    } catch (e) {
      toast({
        title: "提交失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>补充需求信息</CardTitle>
        <CardDescription>
          回答以下问题，让 Agent 更精准地构建你的产品
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <span className="text-muted-foreground">{idx + 1}.</span>
                {q.label}
                {q.required !== false && (
                  <Badge variant="outline" className="text-[10px]">
                    必填
                  </Badge>
                )}
              </Label>
              {q.description && (
                <p className="text-xs text-muted-foreground">{q.description}</p>
              )}

              <Controller
                control={control}
                name={q.id}
                render={({ field }) => (
                  <QuestionField question={q} field={field} />
                )}
              />
              {errors[q.id] && (
                <p className="text-xs text-destructive">
                  {(errors[q.id]?.message as string) ?? "该项有误"}
                </p>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t bg-muted/30 py-3">
          <Button type="submit" disabled={isUpdating} className="bg-lynx-500 text-white hover:bg-lynx-600">
            {isUpdating ? "提交中..." : "确认并开始构建"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function QuestionField({
  question,
  field,
}: {
  question: ClarificationQuestion;
  field: {
    value: unknown;
    onChange: (v: unknown) => void;
  };
}) {
  switch (question.type) {
    case "single":
      return (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => field.onChange(opt)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                field.value === opt
                  ? "border-lynx-500 bg-lynx-500/10 text-lynx-600"
                  : "border-border hover:border-lynx-500/50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    case "multiple":
      return (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => {
            const arr = (field.value as string[]) ?? [];
            const checked = arr.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  field.onChange(
                    checked
                      ? arr.filter((o) => o !== opt)
                      : [...arr, opt],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  checked
                    ? "border-lynx-500 bg-lynx-500/10 text-lynx-600"
                    : "border-border hover:border-lynx-500/50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    case "boolean":
      return (
        <button
          type="button"
          onClick={() => field.onChange(!field.value)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            field.value
              ? "border-lynx-500 bg-lynx-500/10 text-lynx-600"
              : "border-border"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
              field.value ? "border-lynx-500 bg-lynx-500 text-white" : "border-border"
            }`}
          >
            {field.value ? "✓" : null}
          </span>
          {field.value ? "是" : "否"}
        </button>
      );
    case "text":
    default:
      return question.placeholder && question.placeholder.length > 40 ? (
        <Textarea
          value={(field.value as string) ?? ""}
          onChange={(e) => field.onChange(e.target.value)}
          placeholder={question.placeholder}
          className="min-h-[80px]"
        />
      ) : (
        <Input
          value={(field.value as string) ?? ""}
          onChange={(e) => field.onChange(e.target.value)}
          placeholder={question.placeholder}
        />
      );
  }
}
