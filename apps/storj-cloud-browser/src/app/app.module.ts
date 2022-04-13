import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { IonicModule } from '@ionic/angular';
import { FilesOptionsListComponent } from './components/files-options-list/files-options-list.component';
import { DropableDirective } from './directives/dropable.directive';
import { AuthComponent } from './components/auth/auth.component';
import { DriveComponent } from './components/drive/drive.component';
import { AppRoutingModule } from './app-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import {
  AuthService,
  DataStorageProviderInterface,
} from './services/auth.service';
import { IsCurrentBucketPipe } from './pipes/is-current-bucket.pipe';
import { GlobalErrorHandlerService } from './services/global-error-handler.service';
import { S3Provider } from './services/s3-provider.service';
import { environment } from '../environments/environment';
import { DOCUMENT } from '@angular/common';

const databaseFactory = (d: Document): DataStorageProviderInterface => {
  if (!d?.defaultView?.localStorage) {
    throw new Error('localStorage is not defined');
  }
  const storage = d.defaultView.localStorage;
  return {
    getData: async (key: string) => {
      const d = await storage.getItem(key);
      try {
        return d ? JSON.parse(d) : undefined;
      } catch (error) {
        console.log('[ERROR] databaseFactory: ', error);
        return undefined;
      }
    },
    saveData: async (key: string, data: any) => {
      try {
        const value = JSON.stringify(data);
        await storage.setItem(key, value);
        return true;
      } catch (error) {
        console.log('[ERROR] databaseFactory: ', error);
        return false;
      }
    },
    removeData: async (key: string) => {
      await storage.removeItem(key);
      return true;
    },
  };
};

@NgModule({
  declarations: [
    AppComponent,
    FilesOptionsListComponent,
    DropableDirective,
    AuthComponent,
    DriveComponent,
    IsCurrentBucketPipe,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    IonicModule.forRoot({
      mode: 'md',
      swipeBackEnabled: false,
    }),
  ],
  providers: [
    ...(environment.production 
      ? [{
          provide: ErrorHandler,
          useClass: GlobalErrorHandlerService,
        }]
      : []
    ),
    {
      provide: 'DATA_STORAGE_PROVIDER',
      useFactory: (d: Document) => databaseFactory(d),
      deps: [DOCUMENT],
    },
    {
      provide: 'APP_AUTH_SERVICE',
      useClass: AuthService,
      deps: ['DATA_STORAGE_PROVIDER'],
    },
    {
      provide: 'STORJ_STORAGE_PROVIDER',
      useClass: S3Provider,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
