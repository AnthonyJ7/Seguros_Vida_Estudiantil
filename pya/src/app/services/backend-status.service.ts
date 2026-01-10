import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackendStatusService {
  private downSubject = new BehaviorSubject<boolean>(false);
  private msgSubject = new BehaviorSubject<string>('');

  down$ = this.downSubject.asObservable();
  message$ = this.msgSubject.asObservable();

  setDown(message?: string) {
    this.downSubject.next(true);
    if (message) this.msgSubject.next(message);
  }

  setUp() {
    this.downSubject.next(false);
    this.msgSubject.next('');
  }
}
