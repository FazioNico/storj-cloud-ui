import { Pipe, PipeTransform } from '@angular/core';
import { map, Observable } from 'rxjs';
import { DStorageService } from '../services/storage.service';

@Pipe({
  name: 'isCurrentBucket'
})
export class IsCurrentBucketPipe implements PipeTransform {

  constructor(
    private readonly _storage: DStorageService,
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
