import * as React from "react";
import { Link } from "react-router-dom";
import { Package, Plus, ExternalLink, Rocket, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  toast,
} from "@lynxkit/ui-web";
import { creatorApi } from "@/lib/api";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { StoreProduct, StoreStatus } from "@lynxkit/shared";

const STATUS_LABEL: Record<StoreStatus, string> = {
  draft: "草稿",
  pending: "审核中",
  published: "已上架",
  unpublished: "已下架",
  rejected: "已拒绝",
  removed: "已删除",
};

const STATUS_VARIANT: Record<StoreStatus, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  pending: "default",
  published: "default",
  unpublished: "secondary",
  rejected: "destructive",
  removed: "destructive",
};

export default function CreatorProductsPage() {
  const [products, setProducts] = React.useState<StoreProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    creatorApi
      .listProducts()
      .then(setProducts)
      .catch(() => toast({ title: "加载产品失败", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-lynx-500" />
          <h1 className="text-2xl font-bold">我的产品</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-lynx-500 text-white hover:bg-lynx-600">
              <Plus className="mr-2 h-4 w-4" />
              上架新产品
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-lynx-500" />
                上架新产品
              </DialogTitle>
              <DialogDescription>
                LynxKit 的产品通过 AI 构建流水线生成，请在构建会话完成部署后上架。
              </DialogDescription>
            </DialogHeader>
            <ol className="space-y-2 rounded-md border bg-muted/20 px-4 py-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lynx-500/15 text-xs text-lynx-600">1</span>
                在首页输入想法，创建构建会话
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lynx-500/15 text-xs text-lynx-600">2</span>
                完成 9 层 Agent 流水线，生成代码
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lynx-500/15 text-xs text-lynx-600">3</span>
                在部署页一键部署并上架到商店
              </li>
            </ol>
            <DialogFooter>
              <Link to="/">
                <Button className="bg-lynx-500 text-white hover:bg-lynx-600">
                  去构建
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              还没有上架的产品
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              完成一次构建后，可在部署页将产物上架到商店
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                去构建
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <Card key={p.id} className="transition hover:border-lynx-500/40">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    <Badge variant={STATUS_VARIANT[p.status]}>
                      {STATUS_LABEL[p.status]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      v{p.version}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatPrice(p.price)}</span>
                    <span>·</span>
                    <span>{p.downloadCount} 下载</span>
                    <span>·</span>
                    <span>{formatDateTime(p.updatedAt)}</span>
                  </div>
                </div>
                <Link to={`/store/${p.id}`}>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
