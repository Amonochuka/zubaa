import { SIZE_MAX } from '../config';

export type SizeState = { politician: number; citizen: number };

export class SizeSystem {
  private state: SizeState = { politician: 0, citizen: 0 };

  get values(): Readonly<SizeState> {
    return this.state;
  }

  consume(politician: number, citizen: number): SizeState {
    this.state = {
      politician: Phaser.Math.Clamp(this.state.politician + politician, 0, SIZE_MAX),
      citizen: Phaser.Math.Clamp(this.state.citizen + citizen, 0, SIZE_MAX),
    };
    return this.state;
  }

  burst(amount: number): SizeState {
    let remaining = amount;
    while (remaining > 0 && (this.state.politician > 0 || this.state.citizen > 0)) {
      if (this.state.politician >= this.state.citizen && this.state.politician > 0) this.state.politician -= 1;
      else this.state.citizen -= 1;
      remaining -= 1;
    }
    return this.state;
  }

  spendPolitician(amount: number): SizeState {
    this.state.politician = Math.max(0, this.state.politician - amount);
    return this.state;
  }

  reset(): void {
    this.state = { politician: 0, citizen: 0 };
  }
}
