import { DOCUMENT } from "@angular/common";
import { Provider } from "@angular/core";
import { APP_DATA_STORAGE_SERVICE } from "@storj-cloud-ui/injection-token";
import { environment } from "../../environments/environment";
import { DATA_STORAGE_PROVIDER, ENCRYPTED_DATA_STORAGE_PROVIDER, ENCRYPTION_KEY } from "../app.tokens";
import { databaseEncryptionFactory, databaseFactory } from "../factories";
import { DataStorageProviderInterface } from "../services/auth.service";

export const DATABASE_PROVIDERS: Provider[] = [
  {
    provide: ENCRYPTION_KEY,
    // TODO: will be replace soon by digital signature value
    useValue: environment.encryptionSalt,
  },
  {
    provide: DATA_STORAGE_PROVIDER,
    useFactory: (d: Document) => databaseFactory(d),
    deps: [DOCUMENT],
  },
  {
    provide: ENCRYPTED_DATA_STORAGE_PROVIDER,
    useFactory: (
      encryptionKey: string, 
      d: DataStorageProviderInterface
    ) => databaseEncryptionFactory(encryptionKey, d),
    deps: [ENCRYPTION_KEY, DATA_STORAGE_PROVIDER],
  },
  {
    provide: APP_DATA_STORAGE_SERVICE,
    useExisting: ENCRYPTED_DATA_STORAGE_PROVIDER
  }
];