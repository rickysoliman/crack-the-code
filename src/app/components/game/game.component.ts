import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';

interface ClueNum {
  number: string;
  state: 'default' | 'selected' | 'correct' | 'wrong' | 'misplaced';
  index: number;
}

interface Clue {
  text: string;
  numbers: ClueNum[];
  index: number;
}

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
  disableMarkUpButtons: boolean = true;

  selectedClue: Clue | null = null;
  selectedNumber: ClueNum | null = null;

  clues: Clue[] = [
    {
      text: 'One # correct, but wrongly placed',
      index: 0,
      numbers: [
        { number: '9', state: 'default', index: 0 },
        { number: '2', state: 'default', index: 1 },
        { number: '8', state: 'default', index: 2 },
        { number: '5', state: 'default', index: 3 },
      ],
    },
    {
      text: 'Two #s correct, but wrongly placed',
      index: 1,
      numbers: [
        { number: '1', state: 'default', index: 0 },
        { number: '9', state: 'default', index: 1 },
        { number: '3', state: 'default', index: 2 },
        { number: '7', state: 'default', index: 3 },
      ],
    },
    {
      text: 'One # correct, correctly placed',
      index: 2,
      numbers: [
        { number: '5', state: 'default', index: 0 },
        { number: '2', state: 'default', index: 1 },
        { number: '0', state: 'default', index: 2 },
        { number: '1', state: 'default', index: 3 },
      ],
    },
    {
      text: 'Nothing correct',
      index: 3,
      numbers: [
        { number: '6', state: 'default', index: 0 },
        { number: '5', state: 'default', index: 1 },
        { number: '0', state: 'default', index: 2 },
        { number: '7', state: 'default', index: 3 },
      ],
    },
    {
      text: 'Two #s correct, but wrongly placed',
      index: 4,
      numbers: [
        { number: '8', state: 'default', index: 0 },
        { number: '5', state: 'default', index: 1 },
        { number: '2', state: 'default', index: 2 },
        { number: '1', state: 'default', index: 3 },
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

    this.code = '3841'; // for testing purposes
  }

  selectClueBox(clue: Clue, number: ClueNum): void {
    console.log({ clue, number });

    switch (number.state) {
      case 'default':
        number.state = 'selected';
        this.deselectOtherClueBoxes(clue, number);
        this.selectedClue = clue;
        this.selectedNumber = number;
        this.disableMarkUpButtons = false;
        break;
      case 'selected':
        number.state = 'default';
        this.selectedClue = null;
        this.selectedNumber = null;
        this.disableMarkUpButtons = true;
        break;
      // case 'correct':
      //   number.state = 'wrong';
      //   break;
      // case 'wrong':
      //   number.state = 'misplaced';
      //   break;
      // case 'misplaced':
      //   number.state = 'default';
      //   break;
    }
  }

  deselectOtherClueBoxes(clue: Clue, number: ClueNum): void {
    this.clues.forEach((c) => {
      c.numbers.forEach((n) => {
        if (c !== clue || n !== number) {
          n.state = 'default';
        }
      });
    });
  }

  markAsCorrect(): void {
    this.selectedNumber!.state = 'correct';
  }

  markAsMisplaced(): void {
    this.selectedNumber!.state = 'misplaced';
  }

  markAsWrong(): void {
    this.selectedNumber!.state = 'wrong';
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
