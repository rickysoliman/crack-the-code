import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';

interface ClueNum {
  number: string;
  state: 'default' | 'correct' | 'wrong' | 'misplaced';
  index: number;
  selected: boolean;
}

interface Clue {
  text: string;
  numbers: ClueNum[];
  index: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
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
  disableMarkUpButtons: boolean = true;

  selectedClue: Clue | null = null;
  selectedNumber: ClueNum | null = null;

  clues: Clue[] = [
    {
      text: 'One number correct, but wrongly placed',
      index: 0,
      numbers: [
        { number: '7', state: 'default', index: 0, selected: false },
        { number: '9', state: 'default', index: 1, selected: false },
        { number: '1', state: 'default', index: 2, selected: false },
        { number: '6', state: 'default', index: 3, selected: false },
      ],
    },
    {
      text: 'One number correct and correctly placed',
      index: 1,
      numbers: [
        { number: '3', state: 'default', index: 0, selected: false },
        { number: '8', state: 'default', index: 1, selected: false },
        { number: '1', state: 'default', index: 2, selected: false },
        { number: '7', state: 'default', index: 3, selected: false },
      ],
    },
    {
      text: 'Two numbers correct, but wrongly placed',
      index: 2,
      numbers: [
        { number: '2', state: 'default', index: 0, selected: false },
        { number: '4', state: 'default', index: 1, selected: false },
        { number: '3', state: 'default', index: 2, selected: false },
        { number: '9', state: 'default', index: 3, selected: false },
      ],
    },
    {
      text: 'Nothing correct',
      index: 3,
      numbers: [
        { number: '3', state: 'default', index: 0, selected: false },
        { number: '5', state: 'default', index: 1, selected: false },
        { number: '0', state: 'default', index: 2, selected: false },
        { number: '7', state: 'default', index: 3, selected: false },
      ],
    },
    {
      text: 'Two numbers correct and correctly placed',
      index: 4,
      numbers: [
        { number: '6', state: 'default', index: 0, selected: false },
        { number: '7', state: 'default', index: 1, selected: false },
        { number: '3', state: 'default', index: 2, selected: false },
        { number: '4', state: 'default', index: 3, selected: false },
      ],
    },
  ];

  ngOnInit(): void {
    this.generateCode();

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
    // let index = 0;
    // while (index < 4) {
    //   const digit = this.getRandomNumber();
    //   if (!this.code.includes(digit.toString())) {
    //     this.code += digit;
    //     index++;
    //   }
    // }

    this.code = '6824'; // for testing purposes
  }

  selectClueBox(clue: Clue, number: ClueNum): void {
    console.log({ clue, number });

    if (number.selected) {
      number.selected = false;
      this.selectedClue = null;
      this.selectedNumber = null;
      this.disableMarkUpButtons = true;
      return;
    }

    this.deselectOtherClueBoxes(clue, number);

    number.selected = true;
    this.selectedClue = clue;
    this.selectedNumber = number;
    this.disableMarkUpButtons = false;
  }

  deselectOtherClueBoxes(clue: Clue, number: ClueNum): void {
    this.clues.forEach((c) => {
      c.numbers.forEach((n) => {
        if (n !== number) {
          n.selected = false;
        }
      });
    });
  }

  markAsCorrect(): void {
    if (!this.selectedNumber) return;
    this.selectedNumber.state =
      this.selectedNumber.state === 'correct' ? 'default' : 'correct';
    this.selectedNumber.selected = false;
    this.disableMarkUpButtons = true;
    this.selectedNumber = null;
  }

  markAsMisplaced(): void {
    if (!this.selectedNumber) return;
    this.selectedNumber.state =
      this.selectedNumber.state === 'misplaced' ? 'default' : 'misplaced';
    this.selectedNumber.selected = false;
    this.disableMarkUpButtons = true;
    this.selectedNumber = null;
  }

  markAsWrong(): void {
    if (!this.selectedNumber) return;
    this.selectedNumber.state =
      this.selectedNumber.state === 'wrong' ? 'default' : 'wrong';
    this.selectedNumber.selected = false;
    this.disableMarkUpButtons = true;
    this.selectedNumber = null;
  }

  checkAnswer(): void {
    const value = this.codeForm.value;
    const guess = `${value.digit1}${value.digit2}${value.digit3}${value.digit4}`;

    if (guess === this.code) {
      alert('Congratulations! You have guessed the correct code!');
    } else {
      alert('Sorry, you have not guessed the correct code.');
    }
  }
}
