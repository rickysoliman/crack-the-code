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
  disableMarkAllAsWrongButton: boolean = false;

  selectedClue: Clue | null = null;
  selectedNumber: ClueNum | null = null;

  clues: Clue[] = [];

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
    let index = 0;
    while (index < 4) {
      const digit = this.getRandomNumber();
      if (!this.code.includes(digit.toString())) {
        this.code += digit;
        index++;
      }
    }
    this.generateClues();
    // this.code = '6824'; // for testing purposes
  }

  generateClues(): void {
    this.clues = [];

    const generateUniqueGuess = (): string[] => {
      let guess: string[] = [];
      while (guess.length < 4) {
        const digit = this.getRandomNumber().toString();
        if (!guess.includes(digit)) {
          guess.push(digit);
        }
      }
      return guess;
    };

    // Function to evaluate the guess against the code
    const evaluateGuess = (
      guess: string[]
    ): { correct: number; misplaced: number } => {
      let correct = 0;
      let misplaced = 0;

      guess.forEach((digit, index) => {
        if (digit === this.code[index]) {
          correct++; // Correct and well-placed
        } else if (this.code.includes(digit)) {
          misplaced++; // Correct but wrongly placed
        }
      });

      return { correct, misplaced };
    };

    const clueTypes = [
      {
        text: 'One number correct, but wrongly placed',
        correct: 0,
        misplaced: 1,
      },
      {
        text: 'Two numbers correct, but wrongly placed',
        correct: 0,
        misplaced: 2,
      },
      { text: 'One number correct and well-placed', correct: 1, misplaced: 0 },
      { text: 'Nothing correct', correct: 0, misplaced: 0 },
      {
        text: 'Two numbers correct and correctly placed',
        correct: 2,
        misplaced: 0,
      },
    ];

    clueTypes.forEach(({ text, correct, misplaced }, index) => {
      let guess: string[];
      let result;

      do {
        guess = generateUniqueGuess();
        result = evaluateGuess(guess);
      } while (result.correct !== correct || result.misplaced !== misplaced);

      this.clues.push({
        text,
        index,
        numbers: guess.map((num, i) => ({
          number: num,
          state: 'default',
          index: i,
          selected: false,
        })),
      });
    });
    console.log({ clues: this.clues, code: this.code });
  }

  selectClueBox(clue: Clue, number: ClueNum): void {
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

    const newState =
      this.selectedNumber.state === 'correct' ? 'default' : 'correct';

    this.clues.forEach((clue) => {
      clue.numbers.forEach((number) => {
        if (number.number === this.selectedNumber?.number) {
          if (number.index === this.selectedNumber?.index) {
            number.state = newState;
          } else {
            number.state = newState === 'correct' ? 'misplaced' : 'default';
          }
        }
      });
    });

    if (newState === 'correct') {
      const controlName = `digit${this.selectedNumber.index + 1}`;
      this.codeForm.get(controlName)?.setValue(this.selectedNumber.number);
    } else {
      const controlName = `digit${this.selectedNumber.index + 1}`;
      this.codeForm.get(controlName)?.setValue('');
    }

    this.selectedNumber.selected = false;
    this.disableMarkUpButtons = true;
    this.selectedNumber = null;
    this.disableMarkAllAsWrongButton = this.isMarkAllAsWrongButtonDisabled();
  }

  markAsMisplaced(): void {
    if (!this.selectedNumber) return;

    this.selectedNumber.state =
      this.selectedNumber.state === 'misplaced' ? 'default' : 'misplaced';
    this.selectedNumber.selected = false;
    this.disableMarkUpButtons = true;
    this.selectedNumber = null;
    this.disableMarkAllAsWrongButton = this.isMarkAllAsWrongButtonDisabled();
  }

  markAsWrong(): void {
    if (!this.selectedNumber) return;

    this.clues.forEach((clue) => {
      clue.numbers.forEach((number) => {
        if (number.number === this.selectedNumber?.number) {
          number.state = number.state === 'wrong' ? 'default' : 'wrong';
          number.selected = false;
        }
      });
    });

    this.disableMarkUpButtons = true;
    this.selectedNumber = null;
    this.disableMarkAllAsWrongButton = this.isMarkAllAsWrongButtonDisabled();
  }

  isMarkAllAsWrongButtonDisabled(): boolean {
    const nothingCorrectClue = this.clues.find((clue) => {
      return clue.text === 'Nothing correct';
    });

    let areAllNumbersMarkedAsWrong: boolean = true;
    for (let i = 0; i < nothingCorrectClue!.numbers.length; i++) {
      const number = nothingCorrectClue?.numbers[i];
      if (number!.state !== 'wrong') {
        areAllNumbersMarkedAsWrong = false;
        break;
      }
    }

    return areAllNumbersMarkedAsWrong;
  }

  markClueAsWrong(clue: any): void {
    clue.numbers.forEach((number: any) => {
      number.state = 'wrong';
      this.clues.forEach((otherClue: any) => {
        otherClue.numbers.forEach((otherNumber: any) => {
          if (otherNumber.number === number.number) {
            otherNumber.state = 'wrong';
          }
        });
      });
    });

    this.disableMarkAllAsWrongButton = this.isMarkAllAsWrongButtonDisabled();
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
