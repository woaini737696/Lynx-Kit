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
      <div className="relative rounded-2xl border border-border bg-card shadow-lg transition focus-within:border-lynx-500 focus-within:ring-2 focus-within:ring-lynx-500/20">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) =>
            setValue(e.target.value.slice(0, MAX_LEN))
          }
          onKeyDown={onKeyDown}
          placeholder="例如：一个基于 AI 匹配的交友平台，支持语音自我介绍和智能推荐..."
          disabled={isCreating}
          className="min-h-[140px] resize-none border-0 bg-transparent p-5 text-base shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-3 px-4 pb-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
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
                  : "text-muted-foreground",
              )}
            >
              {count}/{MAX_LEN}
            </span>
          </div>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={!value.trim() || isCreating}
            className="bg-lynx-500 text-white hover:bg-lynx-600"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在创建...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                开始构建
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {examples.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">试试：</span>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setValue(ex);
                textareaRef.current?.focus();
              }}
              className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground/80 transition hover:border-lynx-500 hover:text-lynx-600"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
