import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { LoaderService } from './services/loader.service';
import { DStorageService } from './storage.service';

@Component({
  selector: 'storj-cloud-ui-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  public readonly isVisible$: Observable<boolean> = this._loader.isVisible$;

  async ngOnInit() {
    console.log('Init App');    
  }

  constructor(
    private readonly _loader: LoaderService
  ) {}


}
