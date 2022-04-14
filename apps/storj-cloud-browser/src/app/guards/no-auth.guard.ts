import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { APP_AUTH_SERVICE } from '@storj-cloud-ui/injection-token';
import { Observable } from 'rxjs';
import { AppAuthServiceInterface } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(
    @Inject(APP_AUTH_SERVICE) private readonly _service: AppAuthServiceInterface,
    private readonly _router: Router,
    private readonly _loader: LoaderService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot):  Promise<boolean | UrlTree> {
      // display loader
      this._loader.setStatus(true);
      // get current credentials
      const isAuth = await this._service.checkAuth();     
      if (isAuth) {        
        this._router.navigate(['/drive']);
      }
      // hide loader
      this._loader.setStatus(false);
      return !isAuth;
  }
  
}
