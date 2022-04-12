import { Component, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'storj-cloud-ui-files-options-list',
  templateUrl: './files-options-list.component.html',
  styleUrls: ['./files-options-list.component.scss']
})
export class FilesOptionsListComponent {

  @Input() public readonly isFolder?: string;
  
  constructor(
    public readonly popCtrl: PopoverController
  ) {}

}
