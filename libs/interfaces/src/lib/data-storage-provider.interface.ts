export interface DataStorageProviderInterface {
  getData<T>(key: string): Promise<T|undefined>;
  saveData<T>(key: string, data: T): Promise<boolean>;
  removeData(key: string): Promise<boolean>;
}