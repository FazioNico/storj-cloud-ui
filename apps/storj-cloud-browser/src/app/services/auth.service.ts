import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthCredentials {
  bucketName?: string; // default bucket name
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
}

export interface DataStorageProviderInterface {
  getData<T>(key: string): Promise<T|undefined>;
  saveData<T>(key: string, data: T): Promise<boolean>;
  removeData(key: string): Promise<boolean>;
}

export interface AppAuthServiceInterface {
  credentials$: Observable<AuthCredentials|undefined>;
  setCredentials(credentials: AuthCredentials): Promise<void>;
  checkAuth(): Promise<boolean>;
  getCredentials(): Promise<AuthCredentials|undefined>;
  signout(): Promise<void>
}

@Injectable()
export class AuthService implements AppAuthServiceInterface {

  private readonly _KEY_STORAGE = 'storj-cloud-browser-auth';
  private readonly _credentials: BehaviorSubject<AuthCredentials|undefined> = new BehaviorSubject(undefined as any);
  public readonly credentials$ = this._credentials.asObservable();

  constructor(
    @Inject('APP_DATA_STORAGE_SERVICE') private readonly _provider: DataStorageProviderInterface
  ) { }

  async setCredentials(credentials: AuthCredentials) {
    await this._provider.saveData(this._KEY_STORAGE, credentials);
    this._credentials.next(credentials);
  }

  async checkAuth(): Promise<boolean> {
    if (this._credentials.value) {
      return Boolean(this._credentials.value);
    }
    const credentials = await this._provider.getData<AuthCredentials>(this._KEY_STORAGE);
    if (credentials) {
      this._credentials.next(credentials);
    }
    return Boolean(credentials);
  }

  async getCredentials(): Promise<AuthCredentials | undefined> {
    return this._credentials.value;
  }

  async signout() {
    await this._provider.removeData(this._KEY_STORAGE);
    this._credentials.next(undefined);
  }

}
