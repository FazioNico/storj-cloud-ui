import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MediaFile } from '@storj-cloud-ui/interfaces';

@Component({
  selector: 'storj-cloud-ui-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent {

  @Input() public readonly file!: MediaFile;
  public displayPlaceholder = false;

  constructor(
    public readonly modalCtrl: ModalController
  ) { 
  }

  downloadFile() {
    this.modalCtrl.dismiss('download');
  }

  shareFile() {
    this.modalCtrl.dismiss('share');
  }

}
