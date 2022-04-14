import { Observable } from "rxjs";
import { AuthCredentials } from "./auth-credential.interface";

export interface AppAuthServiceInterface {
  credentials$: Observable<AuthCredentials|undefined>;
  setCredentials(credentials: AuthCredentials): Promise<void>;
  checkAuth(): Promise<boolean>;
  getCredentials(): Promise<AuthCredentials|undefined>;
  signout(): Promise<void>
}
