import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { DIRECTIVES } from './directives';
import { COMPONENTS } from './components';
import { PIPES } from './pipes';
import { 
  AUTH_PROVIDERS, 
  DATABASE_PROVIDERS, 
  ERROR_HANDLER_PROVIDERS, 
  FILES_STORAGE_PROVIDERS 
} from './providers';


@NgModule({
  declarations: [
    AppComponent,
    ...DIRECTIVES,
    ...COMPONENTS,
    ...PIPES,
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
    ...ERROR_HANDLER_PROVIDERS,
    ...FILES_STORAGE_PROVIDERS,
    ...DATABASE_PROVIDERS,
    ...AUTH_PROVIDERS,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
