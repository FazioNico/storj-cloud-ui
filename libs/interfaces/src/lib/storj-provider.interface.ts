import { MediaFileInterface } from "./mediafile.interrface";

export interface STORJProviderOptionsInterface {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  prefix?: string;
};

export interface STORJStorageProviderInterface {
  init: (options: STORJProviderOptionsInterface) => Promise<void>;
  listBuckets: () => Promise<{Name: string}[]>;
  getFromBucket: (bucket: string, prefix?: string) => Promise<MediaFileInterface[]>;
  createBucket: (bucketName: string, prefix?: string) => Promise<string>;
  findFile: (bucket: string, key: string) => Promise<MediaFileInterface>;
  uploadFile: (bucket: string, key: string, file: File) => Promise<string>;
  deleteFile: (bucket: string, key: string) => Promise<void>;
  createFolder: (bucket: string, key: string) => Promise<MediaFileInterface>;
  getPublicUrl: (bucket: string, key: string) => Promise<string>;
  moveFile(Bucket: string, fromKey: string, toKey: string): Promise<void>;
}