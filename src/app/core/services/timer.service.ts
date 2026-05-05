import { Injectable, OnDestroy } from '@angular/core';

@Injectable()
export class TimerService implements OnDestroy {
  resendCountdown: number = 30;
  canResend: boolean = false;
  private timerRef: any;

  startResendTimer(initialTime: number = 30, onTick?: () => void) {
    this.canResend = false;
    this.resendCountdown = initialTime;
    this.clearTimer();

    this.timerRef = setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        this.canResend = true;
        this.clearTimer();
      }

      if (onTick) {
        onTick();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }
}
