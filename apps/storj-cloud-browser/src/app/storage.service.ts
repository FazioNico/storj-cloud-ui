import { Inject, Injectable } from "@angular/core";
import * as S3 from "aws-sdk/clients/s3";
import { BehaviorSubject, combineLatest, filter, map, Observable } from "rxjs";
import { MediaFileInterface } from "./mediafile.interrface";
import { v4 as uuidv4 } from 'uuid';

export interface STORJProviderOptionsInterface {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  prefix?: string;
};

@Injectable({
  providedIn: 'root'
})
export class DStorageService {

  private _provider!: S3;
  private _buckets$: BehaviorSubject<{Name: string;}[]> = new BehaviorSubject(null as any);
  private _bucketName$: BehaviorSubject<string> = new BehaviorSubject(null as any);
  private _filterBy$: BehaviorSubject<string> = new BehaviorSubject('root');
  private _items$: BehaviorSubject<MediaFileInterface[]> = new BehaviorSubject(null as any);
  public buckets$: Observable<{Name: string;}[]> = this._buckets$.asObservable();
  //  crreate an Oobservable to get currennt _bucketName
  public bucketName$: Observable<string> = this._bucketName$.asObservable();
  // create an Observable to get current path name
  public currentPath$: Observable<string> = this._filterBy$.asObservable();
  // create an Observable from `items$` that filtered by `_filterBy$` value
  public items$: Observable<MediaFileInterface[]> = combineLatest([
    this._items$.asObservable().pipe(
      filter(Boolean)
    ),
    this._filterBy$.asObservable()
  ]).pipe(
    map(([items, filterBy]) => items.filter(item => item.parent === filterBy))
  );

  // constructor(
  //   @Inject('STORJ_PROVIDER') private readonly _provider: S3
  // ){ }

  async initProvider(options: STORJProviderOptionsInterface) {
    if (this._provider) {
      return;
    }

    // Configuration for the AWS S3 AWS SDK and Storj Hosted Gateway MT
    //  - https://docs.storj.io/dcs/getting-started/quickstart-aws-sdk-and-hosted-gateway-mt
    //  - https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
    const s3 = new S3({
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
    this._provider = s3;
    await this.listBuckets()
  }

  async listBuckets(): Promise<void> {
    // getBuckets from credentials
    const { Buckets } = await this._provider.listBuckets().promise();
    console.log(Buckets);
    if (!Buckets || Buckets?.length === 0) {
      return;
    }
    // only add Bucket if have Name property
    const buckets = [];
    for (let index = 0; index < Buckets.length; index++) {
      const element = Buckets[index];
      if (element.Name) {
        buckets.push(element as any);
      }
    }
    this._buckets$.next(buckets);
    // define default bucket if not set
    if (!this._bucketName$.value && buckets.length > 0) {
      this._bucketName$.next(buckets[0].Name);
    }
  }

  async createBucket(bucketName: string) {
    const result = await this._provider.createBucket({ Bucket: bucketName }).promise();
    console.log(result);
    this._bucketName$.next(bucketName);
    this.listBuckets();
  }

  /**
   * Method to filer items by parent current path
   * This method use `_filterBy$` BehaviorSubject to get current path
   * Then it filter `_items$` BehaviorSubject value to find currrent Folder to get his parent
   * Finaly if trigger `filterBy()` method to update current path
   */
  async filterByParentFolder(): Promise<void> {
    // use `_filterBy$` BehaviorSubject to get current path
    const current = this._filterBy$.value;
    const items = this._items$.value;
    // find current folder
    const item = items.find(item => item.name === current && item.isFolder);
    const parent = item?.parent || 'root';
    // update current path with parent of current folder
    this.filterBy(parent);
  }

  /**
   * Method to update filterBy$ BehaviorSubject
   * 
   * @param path value use to update BehaviorSubject and filter items by parent
   */
  async filterBy(path: string) {
    this._filterBy$.next(path);
  }

  async findFile(Key: string): Promise<File[]> {
    // const { Buckets } = await this._S3.listBuckets().promise();
    // console.log(Buckets);
    const params = {
      Bucket: this._bucketName$.value,
      Key,
    }
    const url = this._provider.getSignedUrl("getObject", params);
    // get blob from url src
    const blob = await fetch(url).then(res => res.blob());
    // create File object from url src and return
    const file = new File([blob], Key) as File;
    return [file];
  }

  /**
   * Method to get all items from S3 bucket
   * it also normalise Data erspoonse to `MediaFileInterface`
   * and sortng folders first before update `_items$` BehaviorSubject value
   * 
   * @param Bucket S3 Bucket name
   * @param Prefix S3 Bucket prefix
   * @returns Promise<MediaFileInterface[]> only use for test
   */
  async getFrom(Bucket: string, Prefix?: string): Promise<MediaFileInterface[]> {
    if (!this._provider) {
      throw new Error("Provider is not initialized");
    }
    console.log('[INFO] getFrom', Bucket, Prefix);
    
    this._bucketName$.next(Bucket);
    const res = await this._provider
      .listObjects({ Bucket, Prefix })
      .promise();
    // extract content response   
    const items: MediaFileInterface[] = res?.Contents
      // formating object data
      ?.map(item  => this._normalizeObject(item, Bucket))
      // find parent; detect folder; normalize name
      ?.map((item) => this._findParentDetectFolder(item))||[];
    // extract files & folders
    const folders = items.filter(item => item?.isFolder);
    const files = items.filter(item => !item?.isFolder);
    // return sorted datas
    const result = [
      // sort folders first
      ...folders.sort((a, b) => a.name.localeCompare(b.name)),
      ...files.sort((a, b) => a.name.localeCompare(b.name)),
    ];
    this._items$.next(result);
    // return all items for better unit test
    return result; 
  }

  async uploads(files: File[]|FileList, opts?: any) {
    const currentPath = this._filterBy$.value;
    const uploads = [];
    for (let i = 0; i < files.length; i++) {
      const element = files[i]; 
      const ext =  element.name.split('.').pop();
      let Key = element.name;
      if (currentPath !== 'root') {
        // find parent folder from current path
        let parent = this._items$.value.find(item => 
          item.name === currentPath && item.isFolder
        )?.name||'root';
        // handle unexisting parent folder
        if (!parent) {
          throw new Error('Parent folder not found');
        }
        // loop until find root folder by using `parent` variable
        while (parent !== 'root') {
          Key = `${parent}/${Key}`;
          // update parent value with item parent
          parent = this._items$.value.find(item => 
            item.name === parent && item.isFolder
          )?.parent||'root';
        }
      }
      // console.log('key: ', Key);
      // create object params
      const params = {
        Bucket: this._bucketName$.value,
        Key: Key,
        Body: element,
        ACL: "public-read", // not working with Storj
        ContentType: element.type||"application/octet-stream",
      };
      // run upload task
      const task = this._provider.upload(params, {
        partSize: 64 * 1024 * 1024
      }).promise();
      // push upload task to uploads array
      uploads.push(task);
    }
    // wait for all uploads to finish
    const tasksResult = await Promise.all(uploads).then(data => {
      return data.map(({Key}) => Key);
    });
    // request find file to get full data
    const filesAdded = await Promise.all(
      tasksResult.map(Key => this._provider
        .getObject({Bucket: this._bucketName$.value, Key})
        .promise()
        .then(res =>  {
          return {
            name: Key,
            url: this._provider.getSignedUrl("getObject", {
              Bucket: this._bucketName$.value, Key
            }),
            LastModified: new Date(res.LastModified||new Date()).toLocaleString(),
            size: res.ContentLength,
          }
        })
      )
    )
    // flat resopnse using reduce caus flat() not working with lib compilator options
    .then(r =>  r.reduce((acc: { name: string; url: string; LastModified: string; size: number | undefined;}[], item) => {
        if (item) {
          acc.push(item);
        }
        return acc;
      }, [])
    );
    // mix all items to one array
    const items = [
      ...this._items$.value,
      ...filesAdded.map(item => this._findParentDetectFolder(item))
    ];
    // extract filers & folders
    const folders = items.filter(item => item?.isFolder);
    const filess = items.filter(item => !item?.isFolder);
    // return sorted datas
    const result = [
      // sort folders first
      ...folders.sort((a, b) => a.name.localeCompare(b.name)),
      ...filess.sort((a, b) => a.name.localeCompare(b.name)),
    ];
    this._items$.next(result);
    // return result for better unit test
    return result;
  }

  async newFolder(name: string) {
    // find parent folder from current path
    const currentPath = this._filterBy$.value;
    const parent = this._items$.value.find(item =>  item.name === currentPath && item.isFolder)?.name||'root';
    // handle unexisting parent folder
    if (!parent) {
      throw new Error('Parent folder not found');
    }
    // create new folder
    const Key = (parent === 'root' ? name : `${parent}/${name}`) + '/.file_placeholder';
    const params = {
      Bucket: this._bucketName$.value,
      Key,
      ACL: "public-read", // not working with Storj
      ContentType: "application/octet-stream",
    };
    // run upload task
    const task = this._provider.putObject(params).promise();
    // wait for upload to finish
    const result = await task.then(data => {
      return {
        name: Key,
        LastModified: new Date().toLocaleString(),
        size: 0,
      }
    });
    // update items
    const items = [
      ...this._items$.value,
      this._findParentDetectFolder(result)
    ];
    // extract filers & folders
    const folders = items.filter(item => item?.isFolder);
    const files = items.filter(item => !item?.isFolder);
    // return sorted datas
    const data = [
      // sort folders first
      ...folders.sort((a, b) => a.name.localeCompare(b.name)),
      ...files.sort((a, b) => a.name.localeCompare(b.name)),
    ];
    this._items$.next(data);
  }

  async delete(Key: string, Bucket?: string ): Promise<void> {
    if (!Bucket) {
      Bucket = this._bucketName$.value;
    }
    const params = { Bucket, Key };
    await this._provider.deleteObject(params).promise();
    // update items
    const items = this._items$.value.filter(item => item.name !== Key);
    // extract files & folders
    const folders = items.filter(item => item?.isFolder);
    const files = items.filter(item => !item?.isFolder);
    // return sorted datas
    const data = [
      // sort folders first
      ...folders.sort((a, b) => a.name.localeCompare(b.name)),
      ...files.sort((a, b) => a.name.localeCompare(b.name)),
    ];
    this._items$.next(data);
  }

  private _normalizeObject({ Key, LastModified, Size }: { Key?: string; LastModified?: Date; Size?: number; }, Bucket : string) {
    if (!Key) {
      throw new Error("Key is required");
    }
    const response = {
      name: Key,
      url: this._provider.getSignedUrl("getObject", {
        Bucket, Key
      }),
      LastModified: new Date(LastModified||'').toLocaleString(),
      size: Size,
    }
    return response;
  }

  private _findParentDetectFolder(item: {
    name: string;
    url?: string;
    LastModified: string;
    size: number | undefined;
  }): MediaFileInterface {
    const folder = item?.name.split('/');
    if (!item || !item.name) {
      throw new Error('Item not found');
    }
    const [name, parent = 'root', ...gdParent] = item.name.split('/').reverse();
    // item is stored inside a sub folder. Find parent folder
    if (folder.length > 1) {
      const isFolder = name === '.file_placeholder';
      return {
        ...item,
        name: isFolder ? parent : name,
        parent: isFolder ? gdParent?.[0] || 'root' : parent,
        isFolder
      }
    } 
    // item is stored in root folder
    else {
      return {...item, parent: 'root', isFolder: false};
    }
  }

}