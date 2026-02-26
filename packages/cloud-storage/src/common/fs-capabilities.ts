/**
 * Inlined values from FileSystemProviderCapabilities (const enum).
 *
 * const enum members are erased at runtime when using transpileOnly / isolatedModules.
 * We inline the numeric values here to avoid silent runtime failures.
 *
 * Source: @opensumi/ide-file-service/lib/common/files.ts
 */
export const FS_CAPABILITIES = {
  FileReadWrite: 1 << 1, // 2
  PathCaseSensitive: 1 << 10, // 1024
} as const;
