import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { LoaderService } from './loader.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {

  constructor(
    private readonly _loader: LoaderService,
    private readonly _alertCtrl: AlertController,
    private _zone: NgZone
  ) { }

  async handleError(error: any) {
    let message = error.message || error;
    // get message error from Unkown Promise Error
    if (message.indexOf('Uncaught (in promise):') !== -1) {
      message = message.split('Uncaught (in promise):')[1].trim();
    }
    console.error('[ERROR] GlobalErrorHandler: ', error.message);
    // use `NgZone.run`, too update loader state even if the error is thrown outside the ngZone
    this._zone.run(() =>  this._loader.setStatus(false));
    // show alert
    const ionAlert = await this._alertCtrl.create({
      header: 'Error',
      message,
      buttons: ['OK'],
      cssClass: 'danger'
    });
    await ionAlert.present();
  }
}

