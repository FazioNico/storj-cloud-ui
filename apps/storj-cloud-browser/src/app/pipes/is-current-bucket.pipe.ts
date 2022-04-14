import { Inject, Pipe, PipeTransform } from '@angular/core';
import { APP_FILES_STORAGE_SERVICE } from '@storj-cloud-ui/injection-token';
import { map, Observable } from 'rxjs';
import { FilesStorageService } from '../services/files-storage.service';

@Pipe({
  name: 'isCurrentBucket'
})
export class IsCurrentBucketPipe implements PipeTransform {

  constructor(
    @Inject(APP_FILES_STORAGE_SERVICE) private readonly _storage: FilesStorageService,
  ) {}
  
  transform(value: string): Observable<boolean> {
    return this._storage.bucketName$.pipe(
      map(bucketName => 
        value && bucketName
          ? bucketName?.toLocaleLowerCase() === value.toLocaleLowerCase()
          : false
      )
    )
  }

}
