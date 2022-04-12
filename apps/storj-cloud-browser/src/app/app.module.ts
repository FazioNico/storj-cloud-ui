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

const databaseFactory = (): DataStorageProviderInterface => {
  return {
    getData: async (key: string) => {
      const d = await localStorage.getItem(key);
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
        await localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.log('[ERROR] databaseFactory: ', error);
        return false;
      }
    },
    removeData: async (key: string) => {
      await localStorage.removeItem(key);
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
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandlerService,
    },
    {
      provide: 'DATA_STORAGE_PROVIDER',
      useFactory: () => databaseFactory(),
    },
    {
      provide: 'APP_AUTH_SERVICE',
      useClass: AuthService,
      deps: ['DATA_STORAGE_PROVIDER'],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
