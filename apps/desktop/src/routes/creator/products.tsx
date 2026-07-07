import { creatorApi } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { StoreProduct, StoreStatus } from "@lynxkit/shared";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Skeleton,
	toast,
} from "@lynxkit/ui-web";
import { ArrowRight, ExternalLink, Package, Plus, Rocket } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

const STATUS_LABEL: Record<StoreStatus, string> = {
	DRAFT: "草稿",
	PENDING: "审核中",
	PUBLISHED: "已上架",
	UNPUBLISHED: "已下架",
	REJECTED: "已拒绝",
	REMOVED: "已删除",
};

const STATUS_VARIANT: Record<
	StoreStatus,
	"default" | "secondary" | "destructive"
> = {
	DRAFT: "secondary",
	PENDING: "default",
	PUBLISHED: "default",
	UNPUBLISHED: "secondary",
	REJECTED: "destructive",
	REMOVED: "destructive",
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
					<Package className="h-6 w-6 text-ink-900 dark:text-ink-100" />
					<h1 className="text-2xl font-bold text-ink-950 dark:text-ink-0">
						我的产品
					</h1>
				</div>
				<Dialog>
					<DialogTrigger asChild>
						<button className="btn-ink inline-flex items-center gap-2 text-sm">
							<Plus className="h-4 w-4" />
							上架新产品
						</button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Rocket className="h-5 w-5 text-ink-900 dark:text-ink-100" />
								上架新产品
							</DialogTitle>
							<DialogDescription>
								妙想 的产品通过 AI 构建流水线生成，请在构建会话完成部署后上架。
							</DialogDescription>
						</DialogHeader>
						<ol className="space-y-2 rounded-md border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm dark:border-ink-800 dark:bg-ink-900/40">
							<li className="flex items-center gap-2 text-ink-700 dark:text-ink-300">
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-xs text-ink-0 dark:bg-ink-100 dark:text-ink-950">
									1
								</span>
								在首页输入想法，创建构建会话
							</li>
							<li className="flex items-center gap-2 text-ink-700 dark:text-ink-300">
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-xs text-ink-0 dark:bg-ink-100 dark:text-ink-950">
									2
								</span>
								完成 9 层 Agent 流水线，生成代码
							</li>
							<li className="flex items-center gap-2 text-ink-700 dark:text-ink-300">
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-xs text-ink-0 dark:bg-ink-100 dark:text-ink-950">
									3
								</span>
								在部署页一键部署并上架到商店
							</li>
						</ol>
						<DialogFooter>
							<Link to="/">
								<button className="btn-ink inline-flex items-center gap-2 text-sm">
									去构建
									<ArrowRight className="h-4 w-4" />
								</button>
							</Link>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-16 w-full rounded-card" />
					))}
				</div>
			) : products.length === 0 ? (
				<div className="glass-card flex flex-col items-center p-16 text-center">
					<Package className="mb-3 h-10 w-10 text-ink-300 dark:text-ink-700" />
					<p className="text-sm text-ink-500 dark:text-ink-400">
						还没有上架的产品
					</p>
					<p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
						完成一次构建后，可在部署页将产物上架到商店
					</p>
					<Link to="/" className="mt-4">
						<button className="btn-ink inline-flex items-center gap-2 text-sm">
							去构建
						</button>
					</Link>
				</div>
			) : (
				<div className="space-y-2">
					{products.map((p) => (
						<div
							key={p.id}
							className="glass-card flex items-center justify-between gap-3 p-4 transition-all duration-200 hover:-translate-y-px"
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="truncate font-medium text-ink-900 dark:text-ink-100">
										{p.name}
									</span>
									<Badge variant={STATUS_VARIANT[p.status]}>
										{STATUS_LABEL[p.status]}
									</Badge>
									<Badge variant="outline" className="text-[10px]">
										v{p.version}
									</Badge>
								</div>
								<p className="mt-1 truncate text-sm text-ink-500 dark:text-ink-400">
									{p.description}
								</p>
								<div className="mt-1 flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
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
						</div>
					))}
				</div>
			)}
		</div>
	);
}
