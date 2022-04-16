import { Inject, Pipe, PipeTransform } from '@angular/core';
import { APP_FILES_STORAGE_SERVICE } from '@storj-cloud-ui/injection-token';
import { BucketExplorerServiceInterface } from '@storj-cloud-ui/interfaces';
import { map, Observable } from 'rxjs';

@Pipe({
  name: 'isCurrentBucket'
})
export class IsCurrentBucketPipe implements PipeTransform {

  constructor(
    @Inject(APP_FILES_STORAGE_SERVICE) private readonly _storage: BucketExplorerServiceInterface,
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
