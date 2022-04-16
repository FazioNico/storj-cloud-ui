import { 
  MediaFile, 
  MediaFileInterface, 
  STORJProviderOptionsInterface, 
  STORJStorageProviderInterface 
} from "@storj-cloud-ui/interfaces";
import * as S3 from "aws-sdk/clients/s3";
import { Injectable } from "@angular/core";

@Injectable()
export class S3Provider implements STORJStorageProviderInterface {

  private _s3!: S3;

  async init(options: STORJProviderOptionsInterface): Promise<void>{
    // Configuration for the AWS S3 AWS SDK and Storj Hosted Gateway MT
    //  - https://docs.storj.io/dcs/getting-started/quickstart-aws-sdk-and-hosted-gateway-mt
    //  - https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
    this._s3 = new S3({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      endpoint: options.endpoint,
      s3ForcePathStyle: true,
      signatureVersion: "v4",
      httpOptions: { timeout: 0 },
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      }
    });
  }

  async listBuckets() {
    // getBuckets from credentials
    const { Buckets } = await this._s3.listBuckets().promise();
    if (!Buckets || Buckets?.length === 0) {
      return [];
    }
    // only add Bucket if have Name property
    const buckets: {Name: string}[] = [];
    for (let index = 0; index < Buckets.length; index++) {
      const element = Buckets[index];
      if (element.Name) {
        buckets.push(element as any);
      }
    }
    return buckets;
  }
  
  async getFromBucket(Bucket: string, Prefix?: string) {
    const res = await this._s3
      .listObjectsV2({ Bucket, Prefix })
      .promise();
    // extract content response   
    const items = res?.Contents
      // formating object data
      ?.map((item)  => this._normalizeObject(item, Bucket))
      // find parent; detect folder; normalize name
      ?.map((item) => this._findParentDetectFolder(item))||[];
    return items.map((item) => new MediaFile(item));
  }

  async createBucket(Bucket: string) {
    return await this._s3
      .createBucket({ Bucket })
      .promise()
      .then(() => Bucket);
  }

  async findFile(Bucket: string, Key: string) {
    const res = await this._s3.getObject({Bucket, Key}).promise()
    .then((res) => this._normalizeObject({
        Key,
        LastModified: new Date(res.LastModified||new Date()),
        Size: res.ContentLength,
        StorageClass: res.StorageClass,
      }, Bucket))
    .then((res) => this._findParentDetectFolder(res));
    return new MediaFile(res);
  }

  async uploadFile(Bucket: string, Key: string, file: File) {
    // clear file name
    if (Key.includes('/.file_placeholder')) {
      Key =  Key.replace('/.file_placeholder', '');
    }
    // create object params
    const params = {
      Bucket,
      Key,
      Body: file,
      ACL: "public-read", // not working with Storj
      ContentType: file.type||"application/octet-stream",
    };
    // run upload task
    const task = await this._s3.upload(params, {
      partSize: 64 * 1024 * 1024
    }).promise();
    //  return key
    return task.Key;
  }

  async deleteFile(Bucket: string, Key: string) {
    await this._s3
      .deleteObject({ Bucket, Key })
      .promise();
  }

  async createFolder(Bucket: string, Key: string) {
    const params = {
      Bucket,
      Key,
      ACL: "public-read", // not working with Storj
      ContentType: "application/octet-stream",
    };
    // run upload task
    return await this._s3.putObject(params).promise()
      .then(() => this._findParentDetectFolder({
        name: Key,
        lastModified: new Date(),
        size: 0,
      }))
      .then(data => new MediaFile(data));
  }

  async getPublicUrl(Bucket: string, Key: string): Promise<string> {
    return this._s3.getSignedUrl("getObject", {
      Bucket,
      Key,
      Expires: 60,
    });
  }

  private _normalizeObject({ Key, LastModified, Size, StorageClass }: { Key?: string; LastModified?: Date; Size?: number; StorageClass?: string|undefined; }, Bucket : string) {
    if (!Key) {
      throw new Error("Key is required");
    }
    const response = {
      name: Key,
      LastModified: new Date(LastModified||'').toLocaleString(),
      size: Size,
      storageClass: StorageClass||undefined,
    }
    return response;
  }

  private _findParentDetectFolder(item: Partial<MediaFileInterface>): Partial<MediaFileInterface> {
    if (!item || !item.name) {
      throw new Error('Item not found');
    }
    const parent = this._getParentKey(item.name);
    const isFolder = this._isFolder(item.name);
    return {
      ...item,
      parent,
      isFolder,
    }
  }

  private _isFolder(key: string){
    return key.endsWith('/')||key.endsWith('/.file_placeholder');
  }

  private _getParentKey(key: string) {
    if (key.endsWith('/.file_placeholder')) {
      key =  key.replace('/.file_placeholder', '');
    }
    const folder = key.split('/');
    if (folder.length > 1) {
      return folder.slice(0, folder.length - 1).join('/') + '/.file_placeholder';
    }
    return 'root';
  }

}