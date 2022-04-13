import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { IonicModule } from '@ionic/angular';
import { DOCUMENT } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DropableDirective } from './directives/dropable.directive';
import { COMPONENTS } from './components';
import { AppRoutingModule } from './app-routing.module';
import {
  AuthService,
  DataStorageProviderInterface,
} from './services/auth.service';
import { IsCurrentBucketPipe } from './pipes/is-current-bucket.pipe';
import { GlobalErrorHandlerService } from './services/global-error-handler.service';
import { S3Provider } from './services/s3-provider.service';
import { environment } from '../environments/environment';
import { databaseEncryptionFactory, databaseFactory } from './factories';


@NgModule({
  declarations: [
    AppComponent,
    ...COMPONENTS,
    DropableDirective,
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
      provide: 'ENCRYPTION_KEY',
      useValue: 'secret',
    },
    {
      provide: 'DATA_STORAGE_PROVIDER',
      useFactory: (d: Document) => databaseFactory(d),
      deps: [DOCUMENT],
    },
    {
      provide: 'DATA_STORAGE_PROVIDER_ENCRYPTION',
      useFactory: (
        encryptionKey: string, 
        d: DataStorageProviderInterface
      ) => databaseEncryptionFactory(encryptionKey, d),
      deps: ['ENCRYPTION_KEY', 'DATA_STORAGE_PROVIDER'],
    },
    {
      provide: 'STORJ_STORAGE_PROVIDER',
      useClass: S3Provider,
    },
    {
      provide: 'APP_AUTH_SERVICE',
      useClass: AuthService,
      deps: ['APP_DATA_STORAGE_SERVICE'],
    },
    {
      provide: 'APP_DATA_STORAGE_SERVICE',
      useExisting: 'DATA_STORAGE_PROVIDER_ENCRYPTION'
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
