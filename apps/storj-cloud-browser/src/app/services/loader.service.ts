import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private _isVisible$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isVisible$ = this._isVisible$.asObservable().pipe(
    debounceTime(250),
    distinctUntilChanged(),
  );

  setStatus(status: boolean) {
    this._isVisible$.next(status);
  }

}
