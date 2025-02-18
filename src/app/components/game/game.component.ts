import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent {
  codeForm = new FormGroup({
    digit1: new FormControl(''),
    digit2: new FormControl(''),
    digit3: new FormControl(''),
    digit4: new FormControl(''),
  });

  code: string = ''; // the code to guess

  disableCheckButton: boolean = true;

  ngOnInit(): void {
    this.generateCode();
    console.log({
      code: this.code,
      disableCheckButton: this.disableCheckButton,
    });

    this.codeForm.valueChanges.subscribe((value) => {
      this.disableCheckButton = !(
        value.digit1 &&
        value.digit2 &&
        value.digit3 &&
        value.digit4
      );
    });
  }

  getRandomNumber(min: number = 0, max: number = 9): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateCode(): void {
    let index = 0;
    while (index < 4) {
      const digit = this.getRandomNumber();
      if (!this.code.includes(digit.toString())) {
        this.code += digit;
        index++;
      }
    }
  }

  checkAnswer(): void {
    const guess = this.codeForm.value;
    console.log({ guess });
  }
}
