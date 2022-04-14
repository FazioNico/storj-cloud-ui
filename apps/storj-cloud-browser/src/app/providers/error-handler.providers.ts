import { ErrorHandler, Provider } from "@angular/core";
import { environment } from "../../environments/environment";
import { GlobalErrorHandlerService } from "../services";

export const ERROR_HANDLER_PROVIDERS: Provider[] = (environment.production) 
  ? [{
      provide: ErrorHandler,
      useClass: GlobalErrorHandlerService,
    }]
  : [];