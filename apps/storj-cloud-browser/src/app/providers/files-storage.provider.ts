import { Provider } from "@angular/core";
import { APP_FILES_STORAGE_SERVICE, STORJ_STORAGE_PROVIDER } from "@storj-cloud-ui/injection-token";
import { FilesStorageService } from "../services/files-storage.service";
import { S3Provider } from "../services/s3-provider.service";

export const FILES_STORAGE_PROVIDERS: Provider[] = [
  {
    provide: STORJ_STORAGE_PROVIDER,
    useClass: S3Provider,
  },
  {
    provide: APP_FILES_STORAGE_SERVICE,
    useClass: FilesStorageService,
    deps: [STORJ_STORAGE_PROVIDER],
  }
];