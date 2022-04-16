import { Inject, Injectable } from '@angular/core';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { LoaderService } from '../services';
import { APP_AUTH_SERVICE, APP_FILES_STORAGE_SERVICE } from '@storj-cloud-ui/injection-token';
import { AppAuthServiceInterface, BucketExplorerServiceInterface } from '@storj-cloud-ui/interfaces';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorjProviderResolver implements Resolve<boolean> {
  
  constructor(
    @Inject(APP_AUTH_SERVICE) private readonly _auth: AppAuthServiceInterface,
    @Inject(APP_FILES_STORAGE_SERVICE) private readonly _storage: BucketExplorerServiceInterface,
    private readonly _looader: LoaderService
  ) {}
  
  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    // display loader
    this._looader.setStatus(true);
    // get current credentials
    const credentials = await this._auth.getCredentials();
    if (!credentials) {
      throw new Error('No credentials');
    }
    // init storj provider
    await this._storage.initProvider(credentials)
    .catch(async(err) => {
      // remove credentials
      await this._auth.signout();
      // throw error
      throw `Failed to connect to STORJ. Verify your credentials and try again.`;
    });
    const bucketName = await firstValueFrom(this._storage.bucketName$);
    if (bucketName||credentials.bucketName) {
      const n = bucketName||credentials.bucketName;
      if (n) {
        await this._storage
          .getFrom(n)
          .catch(err => {
            console.log('XXXXX', err);
          });
      }
    }
    // hide loader
    this._looader.setStatus(false);
    return true;
  }

}
