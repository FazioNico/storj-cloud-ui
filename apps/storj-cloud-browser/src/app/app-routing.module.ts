import { NgModule } from "@angular/core";
import { RouterModule, Route } from "@angular/router";
import { AuthComponent } from "./components/auth/auth.component";
import { DriveComponent } from "./components/drive/drive.component";
import { IsAuthGuard } from "./guards/is-auth.guard";
import { NoAuthGuard } from "./guards/no-auth.guard";
import { StorjProviderResolver } from "./resolvers/storj-provider.resolver";

const ROUTES: Route[] = [
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'drive',
    component: DriveComponent,
    canActivate: [IsAuthGuard],
    resolve: {
      bucketName: StorjProviderResolver
    }
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'auth',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(ROUTES, {
    useHash: false
  })],
  providers: [],
  exports: [RouterModule]
})
export class AppRoutingModule { }