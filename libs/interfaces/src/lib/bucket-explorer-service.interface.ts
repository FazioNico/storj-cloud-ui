import { Observable } from "rxjs";
import { STORJProviderOptionsInterface } from "./storj-provider.interface";
import { MediaFileInterface } from "./mediafile.interrface";

export interface BucketExplorerServiceInterface {
  buckets$: Observable<{
      Name: string;
  }[]>;
  bucketName$: Observable<string>;
  currentPath$: Observable<string>;
  items$: Observable<MediaFileInterface[]>;
  initProvider(options: STORJProviderOptionsInterface): Promise<void>;
  listBuckets(): Promise<void>;
  getFrom(bucket: string, Prefix?: string | undefined): Promise<MediaFileInterface[]>;
  createBucket(bucketName: string): Promise<void>;
  filterByParentFolder(): Promise<void>;
  filterBy(path: string): Promise<void>;
  uploads<T>(files: File[] | FileList, opts?: T): Promise<MediaFileInterface[]>;
  newFolder(name: string): Promise<void>;
  delete(key: string, bucket?: string | undefined): Promise<void>;
  getUrl(key: string, bucket?: string | undefined): Promise<string>;
}