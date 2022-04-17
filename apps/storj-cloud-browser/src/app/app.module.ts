import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { DIRECTIVES } from './directives';
import { COMPONENTS } from './components';
import { PIPES } from './pipes';
import { 
  AUTH_PROVIDERS, 
  DATABASE_PROVIDERS, 
  ERROR_HANDLER_PROVIDERS, 
  FILES_STORAGE_PROVIDERS, 
  INITIALIZER_PROVIDER
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
    FormsModule,
    AppRoutingModule,
    IonicModule.forRoot({
      mode: 'md',
      swipeBackEnabled: false,
    }),
  ],
  providers: [
    ...INITIALIZER_PROVIDER,
    ...ERROR_HANDLER_PROVIDERS,
    ...FILES_STORAGE_PROVIDERS,
    ...DATABASE_PROVIDERS,
    ...AUTH_PROVIDERS,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
