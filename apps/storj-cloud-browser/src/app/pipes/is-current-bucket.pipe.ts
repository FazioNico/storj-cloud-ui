import { Pipe, PipeTransform } from '@angular/core';
import { firstValueFrom, map, Observable, tap } from 'rxjs';
import { DStorageService } from '../storage.service';

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
