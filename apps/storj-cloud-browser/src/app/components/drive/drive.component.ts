import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, PopoverController, ToastController } from '@ionic/angular';
import { AppAuthServiceInterface, MediaFileInterface, BucketExplorerServiceInterface, MediaFile } from '@storj-cloud-ui/interfaces';
import { APP_AUTH_SERVICE, APP_FILES_STORAGE_SERVICE } from '@storj-cloud-ui/injection-token';
import { firstValueFrom, map, Observable } from 'rxjs';
import { FilesOptionsListComponent } from '../files-options-list/files-options-list.component';
import { LoaderService } from '../../services';
import { PreviewComponent } from '../preview/preview.component';

@Component({
  selector: 'storj-cloud-ui-drive',
  templateUrl: './drive.component.html',
  styleUrls: ['./drive.component.scss']
})
export class DriveComponent  implements OnInit {

  public readonly items$: Observable<MediaFileInterface[]> = this._storage.items$;
  public readonly currentPath$:  Observable<string> = this._storage.currentPath$;
  public readonly bucketName$: Observable<string> = this._storage.bucketName$;
  public readonly buckets$: Observable<{Name: string}[]> = this._storage.buckets$;
  public maxBreadcrumbs: number|undefined = 4;
  public breadcrumbs$: Observable<string[]> = this._storage.currentPath$.pipe(
    map(path => {
      const parts = path.split('/');
      const maxBreadcrumbs = this.maxBreadcrumbs||4;
      if (parts.length > maxBreadcrumbs) {
        parts.splice(0, parts.length - maxBreadcrumbs);
      }
      // if parts.length > 1 add `root` folder to first item position
      if (parts.length > 1) {
        parts.unshift('root');
      }
      // remove last item if it is `.file_placeholder``
      if (parts[parts.length - 1] === '.file_placeholder') {
        parts.pop();
      }
      return parts;
    })
  );
  public darkMode!: boolean;

  constructor(
    private readonly _popCtrl: PopoverController,
    private readonly _toastCtrl: ToastController,
    private readonly _alertCtrl: AlertController,
    private readonly _modalCtrl: ModalController,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _loader: LoaderService,
    @Inject(APP_AUTH_SERVICE) private readonly _authService: AppAuthServiceInterface,
    @Inject(APP_FILES_STORAGE_SERVICE) private readonly _storage: BucketExplorerServiceInterface,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {
  }
  
  async ngOnInit() {
    const bucketName = this._route.snapshot.data['bucketName'];
    console.log('init', bucketName);
    this.darkMode = this._document.body.classList.contains('dark');
  }

  async actions(type: string, payload?: any){
    switch (true) {
      case type === 'delete': {
        if (!payload) {
          return;
        }
        const item = payload as MediaFileInterface;
        // display loader
        this._loader.setStatus(true);
        // display confirm
        const ionAlert = await this._alertCtrl.create({
          header: 'Delete',
          message: `Are you sure you want to delete ${item.name}?`,
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Delete',
              role: 'ok',
            }
          ]
        });
        await ionAlert.present();
        const { role } = await ionAlert.onDidDismiss();
        if (role !== 'ok') {
          // hide loader
          this._loader.setStatus(false);
          return;
        }
        if (item.isFolder) {
          await this._storage.deleteFolder(item.name);
        } else {
          await this._storage.delete(item.name);
        }
        //  display toast
        const ionToast = await this._toastCtrl.create({
          message: `🎉 Delete successfully`,
          duration: 2000,
          position: 'bottom',
          color: 'success',
          buttons: ['ok']
        });
        await ionToast.present();
        // hide loader
        this._loader.setStatus(false);
        break;
      }
      case type === 'share': {
        const item = payload as MediaFileInterface;
        // display loader
        this._loader.setStatus(true);
        const url = item.url 
          ? item.url
          : await this._storage.getUrl(item.name);
        if (!url) {
          throw 'No url found';
        }
        // copy url to clipboard
        await navigator.clipboard.writeText(url);
        // display confirm toast
        const ionToast = await this._toastCtrl.create({
          message: 'Public URL copied to clipboard',
          duration: 2000,
          position: 'bottom',
          color: 'success',
          buttons: ['ok']
        });
        await ionToast.present();
        // hide loader
        this._loader.setStatus(false);
        break;
      }
      case type === 'download': {
        const item = payload as MediaFileInterface;
        // display loader
        this._loader.setStatus(true);
        const url = item.url 
          ? item.url
          : await this._storage.getUrl(item.name);
        if (!url) {
          throw 'No url found';
        }
        // download file from url
        // TODO: Try to find why this opens in a new tab without download 
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = item.name;
        link.click();
        link.remove();
        // hide loader
        this._loader.setStatus(false);
        break;
      }
      case type === 'navTo': {
        const item = payload as MediaFileInterface;
        this.navTo(item.name);
        break;
      }
      case type === 'preview': {
        const item = payload as MediaFileInterface;
        const { data, role} = await this.preview(item);
        if (role === 'cancel') {
          return;
        }
        this.actions(data, item);
        break;
      }
      case type === 'rename': {
        const item = payload as MediaFileInterface;
        await this.rename(item)
        break;
      }
      default:
        break;
    } 
  }

  async onFileChange(event: any) {
    // display loader
    this._loader.setStatus(true);
    // upload file
    const files = event?.target?.files;
    if (!files) {
      return;
    }
    await this._storage.uploads(files);  
    // display toast  
    const ionToast = await this._toastCtrl.create({
      message: `🎉 Uploaded ${files.length} files successfully`,
      duration: 2618,
      position: 'bottom',
      color: 'success',
      buttons: ['ok']
    });
    // hide loader
    this._loader.setStatus(false);
    // present toast
    await ionToast.present();
    event?.target?.classList?.remove('filedrop');
  }

  async newFolder() {
    // ask for folder name
    const ionAlert = await this._alertCtrl.create({
      header: 'New Folder',
      inputs: [
        {
          name: 'folderName',
          type: 'text',
          placeholder: 'Folder Name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Create',
          role: 'ok',
        }
      ]
    });
    await ionAlert.present();
    const { data, role } = await ionAlert.onDidDismiss();    
    if (role !== 'ok' || !data.values.folderName) {
      return;
    }
    // display loader
    this._loader.setStatus(true);
    await this._storage.newFolder(data.values.folderName);
    // hide loader
    this._loader.setStatus(false);
  }

  trackByfn(index: number, item: MediaFileInterface) {
    return item._id;
  }

  navToFolderName(breadcrumbs: string[], breadcrumb: string) {
    const index = breadcrumbs.indexOf(breadcrumb);
    if (index === -1) {
      return;
    }
    if (breadcrumb === 'root') {
      this.navTo('root');
      return;
    }
    let path = breadcrumbs.slice(0, index + 1).join('/');
    // remove 'root' folder from path
    if (path.startsWith('root/')) {
      path = path.replace('root/', '');
    }
    // add `.file_placeholder` to path
    path += '/' + '.file_placeholder';
    this.navTo(path);
  }

  navTo(path: string) {
    this._storage.filterBy(path);
  }

  async navBack() {
    // display loader
    this._loader.setStatus(true);
    // navigate back
    await this._storage.filterByParentFolder();
    // hide loader
    this._loader.setStatus(false);
  }

  async openOptions($event: MouseEvent, item: MediaFileInterface) {
    const ionPopover = await this._popCtrl.create({
      component: FilesOptionsListComponent,
      componentProps: {isFolder: item.isFolder},
      event: $event,
      translucent: true
    });
    await ionPopover.present();
    // handle close event
    const { data, role } = await ionPopover.onDidDismiss();
    if (role === 'close') {
      return;
    }
    await this.actions(data, item);
  }

  async openSettings() {
    const credentials = await this._authService.getCredentials();
    if (!credentials) {
      throw new Error('No credentials found');
    }
    const ionAlert = await this._alertCtrl.create({
      header: 'STORJ settings',
      message: `Define your preferred settings`,
      inputs: [
        {
          name: 'bucketName',
          type: 'text',
          placeholder: 'Default bucket Name',
          value: credentials.bucketName,
          label: 'Default bucket Name',
        },
        // {
        //   name: 'accessKeyId',
        //   type: 'password',
        //   placeholder: 'Access Key Id',
        //   value: credentials.accessKeyId
        // },
        // {
        //   name: 'secretAccessKey',
        //   type: 'password',
        //   placeholder: 'Secret Access Key',
        //   value: credentials.secretAccessKey
        // },
        // {
        //   name: 'endpoint',
        //   type: 'url',
        //   placeholder: 'Endpoint',
        //   value: credentials.endpoint
        // },
        // {
        //   name: 'darkmode',
        //   type: 'checkbox',
        //   label: 'Dark Mode',
        //   value: false
        // }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          role: 'ok',
        }
      ]
    });
    await ionAlert.present();
    const { data, role } = await ionAlert.onDidDismiss();
    console.log(data, role);
    
    if (role !== 'ok') {
      return;
    }
    console.log(data.values);
    // set default bucket name if value have changed
    const currentDefaultBucketname = credentials?.bucketName||undefined
    if (data.values.bucketName !== currentDefaultBucketname) {
      // save data
      await this._authService.setCredentials({
        ...credentials,
        ...data.values
      });
    }
    // this._storage.setConfig(data.values.bucketName);
    //  display toast
    const ionToast = await this._toastCtrl.create({
      message: `🎉 Settings saved successfully`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: ['ok']
    });
    await ionToast.present();
  }

  async createBucket() {
    const ionAlert = await this._alertCtrl.create({
      header: 'New Bucket',
      inputs: [
        {
          name: 'bucketName',
          type: 'text',
          placeholder: 'Bucket Name',
          value: ``
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          role: 'ok',
        }
      ]
    });
    await ionAlert.present();
    const { data, role } = await ionAlert.onDidDismiss();    
    if (role !== 'ok') {
      return;
    }
    // display loader
    this._loader.setStatus(true);
    await this._storage.createBucket(data.values.bucketName);
    //  display toast
    const ionToast = await this._toastCtrl.create({
      message: `🎉 Settings saved successfully`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: ['ok']
    });
    await ionToast.present();
    // preload bucket data
    await this._storage.getFrom(data.values.bucketName);
    // hide loader
    this._loader.setStatus(false);
  }

  async loadBucket(bucketName: string) {
    // display loader
    this._loader.setStatus(true);
    // load bucket data
    await this._storage.getFrom(bucketName);
    // hide loader
    this._loader.setStatus(false);
  }

  async disconnect() {
    // display loader
    this._loader.setStatus(true);
    await this._authService.signout();
    await this._router.navigate(['/auth']);
    // hide loader
    this._loader.setStatus(false);
  }

  async reload() {
    const bucketName = await firstValueFrom(this.bucketName$);
    if (!bucketName) {
      throw 'No bucket name found';
    }
    // display loader
    this._loader.setStatus(true);
    // load bucket data
    await this._storage.getFrom(bucketName);
    // hide loader
    const t = setTimeout(() => {
      this._loader.setStatus(false);
      clearTimeout(t);
    },250);
  }

  async toggleDarkMode() {
    this._document.defaultView?.localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');
    this._document.body.classList.toggle('dark');
  }

  async preview(item: MediaFileInterface) {
    const url = item.url 
      ? item.url
      : await this._storage.getUrl(item.name);
    if (!url) {
      throw 'No url found';
    }
    // open modal
    const ionModal = await this._modalCtrl.create({
      component: PreviewComponent,
      componentProps: {
        file: new MediaFile({...item, url})
      },
      cssClass: 'preview-modal'
    });
    await ionModal.present();
    const { data, role } = await ionModal.onDidDismiss();
    return { data, role };
  }

  async rename(item: MediaFileInterface) {
    const ionAlert = await this._alertCtrl.create({
      header: 'Rename',
      message: `Enter new name for ${item.name.split('/').pop()}`,
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'New name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Rename',
          role: 'ok',
        }
      ]
    });
    await ionAlert.present();
    const { role, data } = await ionAlert.onDidDismiss();
    if (role !== 'ok') {
      return;
    }
    const newName = data.values.name;
    if (!newName) {
      return;
    }
    // display loader
    this._loader.setStatus(true);
    await this._storage.rename(item.name, newName);
    //  display toast
    const ionToast = await this._toastCtrl.create({
      message: `🎉 Rename successfully`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: ['ok']
    });
    await ionToast.present();
    // hide loader
    this._loader.setStatus(false);
  }
}
