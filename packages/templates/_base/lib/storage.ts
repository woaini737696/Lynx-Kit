/**
 * 文件上传 / 存储封装
 *
 * 业务方接入时选择实际存储驱动：
 *   - 本地磁盘（默认占位）
 *   - 阿里云 OSS / 腾讯云 COS / AWS S3
 *   - Cloudflare R2
 *
 * 这里仅定义统一接口与本地占位实现
 */

export interface UploadOptions {
  /** 自定义 key 前缀，例如 `avatars/` */
  prefix?: string;
  /** 限制文件类型，例如 ["image/png", "image/jpeg"] */
  allowedMimeTypes?: string[];
  /** 限制大小（字节） */
  maxSizeBytes?: number;
}

export interface UploadResult {
  url: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface StorageDriver {
  upload(file: File | Blob, options?: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  signedUrl(key: string, expiresIn?: number): Promise<string>;
}

/**
 * 本地磁盘占位实现
 * 真实场景下应替换为云存储驱动
 */
class LocalStorageDriver implements StorageDriver {
  async upload(file: File | Blob, options: UploadOptions = {}): Promise<UploadResult> {
    if (options.allowedMimeTypes && "type" in file) {
      if (!options.allowedMimeTypes.includes(file.type)) {
        throw new Error(`不支持的文件类型：${file.type}`);
      }
    }
    if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
      throw new Error(
        `文件大小超出限制：${file.size} > ${options.maxSizeBytes}`,
      );
    }
    // 占位：实际项目中应调用后端 /api/upload 上传到本地或云存储
    const filename = "name" in file ? (file as File).name : "blob";
    const key = `${options.prefix ?? ""}${Date.now()}-${filename}`;
    return {
      url: `/uploads/${key}`,
      key,
      filename,
      mimeType: file.type,
      size: file.size,
    };
  }

  async delete(key: string): Promise<void> {
    // 占位
    void key;
  }

  async signedUrl(key: string, _expiresIn = 3600): Promise<string> {
    return `/uploads/${key}`;
  }
}

let currentDriver: StorageDriver = new LocalStorageDriver();

/**
 * 替换存储驱动（业务方接入云存储时调用）
 */
export function setStorageDriver(driver: StorageDriver) {
  currentDriver = driver;
}

export async function uploadFile(
  file: File | Blob,
  options?: UploadOptions,
): Promise<UploadResult> {
  return currentDriver.upload(file, options);
}

export async function deleteFile(key: string): Promise<void> {
  return currentDriver.delete(key);
}

export async function getSignedUrl(
  key: string,
  expiresIn?: number,
): Promise<string> {
  return currentDriver.signedUrl(key, expiresIn);
}
