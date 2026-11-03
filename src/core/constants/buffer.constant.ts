/** Node's default execFile buffer is 1 MiB, which truncates a large diff or a large file. */
export const MAX_BUFFER_BYTES = 64 * 1024 * 1024;
