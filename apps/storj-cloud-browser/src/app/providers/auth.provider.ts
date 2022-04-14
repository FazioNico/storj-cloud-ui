import { Provider } from "@angular/core";
import { 
  APP_AUTH_SERVICE, 
  APP_DATA_STORAGE_SERVICE 
} from "@storj-cloud-ui/injection-token";

import { AuthService } from "../services";

export const AUTH_PROVIDERS: Provider[] = [
  {
    provide: APP_AUTH_SERVICE,
    useClass: AuthService,
    deps: [APP_DATA_STORAGE_SERVICE],
  },
];