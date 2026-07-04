import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Paperclip, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button, Textarea } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";
import { useBuild } from "@/hooks/use-build";
import { toast } from "@lynxkit/ui-web";
import { ProductType, matchProductType } from "@lynxkit/shared";

const MAX_LEN = 2000;

interface InspirationInputProps {
  /** 示例 chips */
  examples?: string[];
  className?: string;
}

/**
 * 灵感输入框
 *
 * - 大文本输入（Enter 提交，Shift+Enter 换行）
 * - 字数统计
 * - 附件按钮（占位，桌面端可后续接入本地文件）
 * - 加载态：创建会话期间禁用并显示 spinner
 * - 提交 → matchProductType → POST /api/v1/build → 跳转 /build/[sessionId]
 */
export function InspirationInput({
  examples = ["AI 交友平台", "AI 数据分析", "AI 客服", "AI 内容创作"],
  className,
}: InspirationInputProps) {
  const navigate = useNavigate();
  const { createBuild, isCreating } = useBuild();
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const count = value.length;

  const submit = React.useCallback(async () => {
    const text = value.trim();
    if (!text || isCreating) return;
    // 意图识别：匹配产品类型（命中则用，否则默认 SOCIAL）
    const matched = matchProductType(text);
    const productType = matched?.type ?? ProductType.SOCIAL;
    try {
      const session = await createBuild({
        productType,
        userInput: text,
      });
      navigate(`/build/${session.id}`);
    } catch (e) {
      toast({
        title: "创建构建失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  }, [value, isCreating, createBuild, navigate]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="glass-card relative p-5 transition-all duration-200 focus-within:-translate-y-px">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) =>
            setValue(e.target.value.slice(0, MAX_LEN))
          }
          onKeyDown={onKeyDown}
          placeholder="例如：一个基于 AI 匹配的交友平台，支持语音自我介绍和智能推荐..."
          disabled={isCreating}
          className="min-h-[140px] resize-none border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
              onClick={() =>
                toast({ title: "附件功能即将上线", description: "支持上传需求文档 / 草图" })
              }
            >
              <Paperclip className="mr-1.5 h-4 w-4" />
              附件
            </Button>
            <span
              className={cn(
                "text-xs tabular-nums",
                count > MAX_LEN * 0.9
                  ? "text-destructive"
                  : "text-ink-500 dark:text-ink-400",
              )}
            >
              {count}/{MAX_LEN}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!value.trim() || isCreating}
            className="btn-ink inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                正在创建...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                开始构建
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {examples.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-500 dark:text-ink-400">试试：</span>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setValue(ex);
                textareaRef.current?.focus();
              }}
              className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-sm text-ink-700 transition-all duration-200 hover:-translate-y-px hover:border-ink-950 hover:text-ink-950 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-100 dark:hover:text-ink-100"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
