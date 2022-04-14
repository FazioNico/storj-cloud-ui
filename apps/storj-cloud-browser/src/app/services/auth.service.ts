import { Inject, Injectable } from '@angular/core';
import { APP_DATA_STORAGE_SERVICE } from '@storj-cloud-ui/injection-token';
import { AppAuthServiceInterface, AuthCredentials, DataStorageProviderInterface } from '@storj-cloud-ui/interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class AuthService implements AppAuthServiceInterface {

  private readonly _KEY_STORAGE = 'storj-cloud-browser-auth';
  private readonly _credentials: BehaviorSubject<AuthCredentials|undefined> = new BehaviorSubject(undefined as any);
  public readonly credentials$ = this._credentials.asObservable();

  constructor(
    @Inject(APP_DATA_STORAGE_SERVICE) private readonly _provider: DataStorageProviderInterface
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
