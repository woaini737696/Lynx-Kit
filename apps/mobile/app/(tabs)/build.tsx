import type { BuildSession, BuildStatus } from "@lynxkit/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChevronRight, Hammer, Plus, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
	Alert,
	FlatList,
	Pressable,
	Text,
	View,
	useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "../../src/components/empty-state";
import { buildApi } from "../../src/lib/api";

const STATUS_LABEL_KEY: Record<BuildStatus, string> = {
	DRAFT: "build.status.draft",
	CLARIFYING: "build.status.clarifying",
	ARCHITECTING: "build.status.architecting",
	DEVELOPING: "build.status.developing",
	TESTING: "build.status.testing",
	DEPLOYING: "build.status.deploying",
	DEPLOYED: "build.status.deployed",
	ERROR: "build.status.error",
};

/** 语义状态色（DESIGN_SYSTEM.md 允许的 success/error） */
const STATUS_COLOR: Record<BuildStatus, string> = {
	DRAFT: "#71717A",
	CLARIFYING: "#71717A",
	ARCHITECTING: "#71717A",
	DEVELOPING: "#71717A",
	TESTING: "#71717A",
	DEPLOYING: "#71717A",
	DEPLOYED: "#22C55E",
	ERROR: "#EF4444",
};

export default function BuildListScreen() {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const isDark = useColorScheme() === "dark";
	const queryClient = useQueryClient();
	const {
		data: sessions,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery({
		queryKey: ["builds", "all"],
		queryFn: () => buildApi.list(),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => buildApi.remove(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["builds"] });
		},
	});

	const handleDelete = (session: BuildSession) => {
		Alert.alert(
			t("build.deleteBuild"),
			`确定要删除「${String(session.config?.name ?? session.productType)}」吗？`,
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: () => deleteMutation.mutate(session.id),
				},
			],
		);
	};

	return (
		<View className="flex-1 bg-ink-100 dark:bg-ink-950">
			{/* 顶部标题 + 新建构建胶囊按钮 */}
			<View style={{ paddingTop: insets.top + 16 }} className="px-4 pb-3">
				<View className="flex-row items-center justify-between gap-3">
					<Text className="text-2xl font-semibold text-ink-900 dark:text-ink-50">
						{t("build.myBuilds")}
					</Text>
					<Pressable
						onPress={() => router.push("/(tabs)/home")}
						className="flex-row items-center gap-2 rounded-full bg-ink-950 px-4 py-2.5 active:opacity-80 dark:bg-ink-100"
					>
						<Plus size={16} color={isDark ? "#09090B" : "#FFFFFF"} />
						<Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
							{t("build.goBuild")}
						</Text>
					</Pressable>
				</View>
			</View>

			<FlatList
				data={sessions ?? []}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
				contentContainerClassName="px-4 gap-3"
				refreshing={isRefetching}
				onRefresh={refetch}
				ListEmptyComponent={
					!isLoading ? (
						<EmptyState
							icon={<Hammer size={28} color="#52525B" />}
							title={t("build.empty")}
							subtitle={t("build.emptyHint")}
							actionLabel={t("build.goBuild")}
							onAction={() => router.push("/(tabs)/home")}
						/>
					) : null
				}
				renderItem={({ item }) => (
					<BuildCard session={item} onDelete={() => handleDelete(item)} />
				)}
			/>
		</View>
	);
}

function BuildCard({
	session,
	onDelete,
}: {
	session: BuildSession;
	onDelete: () => void;
}) {
	const { t } = useTranslation();
	const color = STATUS_COLOR[session.status] ?? "#71717A";
	const isError = session.status === "ERROR";
	return (
		<Pressable
			onPress={() => router.push(`/build/${session.id}`)}
			className="gap-2 rounded-3xl border border-white/70 bg-white/70 p-4 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
		>
			<View className="flex-row items-center justify-between">
				<Text
					className="flex-1 text-base font-semibold text-ink-900 dark:text-ink-50"
					numberOfLines={1}
				>
					{String(session.config?.name ?? session.productType)}
				</Text>
				{/* badge-glass：毛玻璃状态标签 */}
				<View className="flex-row items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
					<View
						className="h-1.5 w-1.5 rounded-full"
						style={{ backgroundColor: color }}
					/>
					<Text
						className={`text-xs ${isError ? "text-red-500" : "text-ink-600 dark:text-ink-300"}`}
					>
						{t(STATUS_LABEL_KEY[session.status])}
					</Text>
				</View>
			</View>
			<View className="flex-row items-center justify-between">
				<Text className="flex-1 text-xs text-ink-500 dark:text-ink-400">
					{t("build.version", { version: session.version })} ·{" "}
					{t("build.updatedAt", {
						time: new Date(session.updatedAt).toLocaleString(),
					})}
				</Text>
				<View className="flex-row items-center gap-1">
					<ChevronRight size={16} color="#A1A1AA" />
					<Pressable
						onPress={onDelete}
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
						className="active:opacity-50"
					>
						<Trash2 size={16} color="#EF4444" />
					</Pressable>
				</View>
			</View>
		</Pressable>
	);
}
