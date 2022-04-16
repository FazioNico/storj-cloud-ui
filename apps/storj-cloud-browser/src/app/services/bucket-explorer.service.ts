import { Inject, Injectable } from "@angular/core";
import { 
  MediaFileInterface, 
  STORJProviderOptionsInterface, 
  STORJStorageProviderInterface } from "@storj-cloud-ui/interfaces";
import { BehaviorSubject, combineLatest, filter, map, Observable } from "rxjs";

@Injectable()
export class BucketExplorerService {

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
    // map(([items, filterBy]) => items),
    map(([items, filterBy]) => items.filter(item => item.parent === filterBy))
  );

  constructor(
    @Inject('STORJ_STORAGE_PROVIDER') private readonly _provider: STORJStorageProviderInterface
  ){ }

  async initProvider(options: STORJProviderOptionsInterface) {
    if (!this._provider) {
      throw new Error('STORJ_STORAGE_PROVIDER is not defined');
    }
    await this._provider.init(options);
    await this.listBuckets();
  }

  async listBuckets(): Promise<void> {
    const buckets = await this._provider.listBuckets();
    this._buckets$.next(buckets);
    // define default bucket if not set
    if (!this._bucketName$.value && buckets.length > 0) {
      this._bucketName$.next(buckets[0].Name);
    }
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
    // extract content response   
    const items = await this._provider.getFromBucket(Bucket, Prefix)
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

  async createBucket(bucketName: string) {
    await this._provider.createBucket(bucketName);
    this._bucketName$.next(bucketName);
    await this.listBuckets();
  }

  /**
   * Method to filer items by parent current path. Like navigation back.
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

  async uploads(files: File[]|FileList, opts?: any) {
    const currentPath = this._filterBy$.value;
    console.log('[INFO] uploads', currentPath);
    const uploads = [];
    for (let i = 0; i < files.length; i++) {
      const element = files[i]; 
      const ext =  element.name.split('.').pop();
      let Key = element.name;
      if (currentPath !== 'root') {
        Key = `${currentPath}/${Key}`;
      }
      const task = this._provider.uploadFile(this._bucketName$.value, Key, element);
      // push upload task to uploads array
      uploads.push(task);
    }
    // wait for all uploads to finish
    const tasksResult = await Promise.all(uploads);
    // request find file to get full data
    const filesAdded = await Promise.all(tasksResult.map(
      Key => this._provider.findFile(this._bucketName$.value, Key))
    );
    // mix all items to one array
    const items = [
      ...this._items$.value,
      ...filesAdded
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
    let currentPath = this._filterBy$.value;
    // remove  `/.file_placeholder` to path
    currentPath = currentPath.replace('/.file_placeholder', '');
    // handle unexisting parent folder
    if (!currentPath) {
      throw new Error('CurrentPath not found');
    }
    // create new folder
    let Key = (currentPath === 'root' ? name : `${currentPath}/${name}`);
    Key = `${Key}/.file_placeholder`;
    // run upload task
    const result = await this._provider.createFolder(this._bucketName$.value, Key);
    // update items
    const items = [
      ...this._items$.value,
      result
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
    await this._provider.deleteFile(Bucket, Key);
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

  async getUrl(Key: string, Bucket?: string ){
    if (!Bucket) {
      Bucket = this._bucketName$.value;
    }
    return this._provider.getPublicUrl(Bucket, Key);
  }

}