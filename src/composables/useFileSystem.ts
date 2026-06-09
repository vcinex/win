import { reactive, ref, watch } from "vue";
import type { FileMetadata } from "../services/fs";

const STORAGE_KEY = "vfs_data";

export function useFileSystem() {
	// 内部状态，使用 reactive 实现深度响应式
	const fsState = reactive<{
		files: Record<string, { content: string; mtime: number; size: number }>;
	}>({
		files: (() => {
			try {
				const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
				return data.files || {};
			} catch (e) {
				return {};
			}
		})(),
	});

	// 持久化：当状态改变时自动保存
	watch(
		fsState,
		(newState) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
		},
		{ deep: true },
	);

	const fileList = ref<string[]>(Object.keys(fsState.files).sort());

	const updateFileList = () => {
		fileList.value = Object.keys(fsState.files).sort();
	};

	const readFile = (path: string) => {
		const file = fsState.files[path];
		return file ? file.content : null;
	};

	const writeFile = (path: string, content: string) => {
		const now = Date.now();
		const size = new Blob([content]).size;

		fsState.files[path] = {
			content,
			mtime: now,
			size: size,
		};
		updateFileList();
	};

	const deleteFile = (path: string) => {
		if (fsState.files[path]) {
			delete fsState.files[path];
			updateFileList();
		}
	};

	const getMetadata = (path: string): FileMetadata | null => {
		const file = fsState.files[path];
		if (!file) return null;
		return {
			name: path.split("/").pop() || "",
			path,
			size: file.size,
			mtime: file.mtime,
			type: "file",
		};
	};

	return {
		files: fileList,
		readFile,
		writeFile,
		deleteFile,
		getMetadata,
		updateFileList,
	};
}
