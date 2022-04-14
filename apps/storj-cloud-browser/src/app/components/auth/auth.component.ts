import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { APP_AUTH_SERVICE } from '@storj-cloud-ui/injection-token';
import { AppAuthServiceInterface } from '../../services/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'storj-cloud-ui-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {

  public form = new FormGroup({
    // bucket: new FormControl('', Validators.compose([
    //   Validators.required,
    //   Validators.minLength(3),
    // ])),
    accessKeyId: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(3),
    ])),
    secretAccessKey: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(3),
    ])),
    endpoint: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(3),
    ])),
  });

  constructor(
    @Inject(APP_AUTH_SERVICE) private readonly _service: AppAuthServiceInterface,
    private readonly _router: Router,
    private readonly _loader: LoaderService
  ) { }

  async login() {
    if (!this.form.valid) {
      throw  'Invalid credentials';
    }
    // display loader
    this._loader.setStatus(true);
    const credentials = this.form.value;
    await this._service.setCredentials(credentials);
    // nav to Drive page
    this._router.navigate(['/drive']);
    // hide loader
    this._loader.setStatus(false);
    this.form.reset();
  }

}
