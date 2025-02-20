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
  disableResetButton: boolean = true;

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
  }

  generateClues(): void {
    const allCodeDigits = new Set(this.code); // Ensure all code digits appear
    const usedDigits = new Set<string>();

    // Track known correct/misplaced digits to ensure consistency
    const knownCorrect = new Map<number, string>(); // index -> digit
    const knownMisplaced = new Set<string>(); // digits known to be in the code but misplaced

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
      {
        text: 'One number correct and correctly placed',
        correct: 1,
        misplaced: 0,
      },
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

        // Ensure no contradictions with previously known correct/misplaced digits
        if (text === 'Nothing correct') {
          if (guess.some((digit) => allCodeDigits.has(digit))) {
            continue;
          }
        }

        // Ensure "One number correct" clues don't contradict later confirmations
        if (correct === 1 || misplaced === 1) {
          let confirmedDigits = [...knownCorrect.values(), ...knownMisplaced];
          if (confirmedDigits.length > 1) continue;
        }

        // Ensure "Two numbers correct" clues don't contradict previous statements
        if (correct === 2 || misplaced === 2) {
          if ([...knownCorrect.values(), ...knownMisplaced].length < 2)
            continue;
        }
      } while (result.correct !== correct || result.misplaced !== misplaced);

      // Track used digits
      guess.forEach((digit, i) => usedDigits.add(digit));

      // Update known correct/misplaced numbers
      guess.forEach((digit, i) => {
        if (result.correct > 0 && this.code[i] === digit) {
          knownCorrect.set(i, digit); // Correctly placed
        } else if (result.misplaced > 0 && this.code.includes(digit)) {
          knownMisplaced.add(digit); // Misplaced
        }
      });

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

    // Ensure all code digits appear at least once
    allCodeDigits.forEach((codeDigit) => {
      if (!usedDigits.has(codeDigit)) {
        // Find a clue with a replaceable digit
        for (const clue of this.clues) {
          const replaceableIndex = clue.numbers.findIndex(
            (num) => !this.code.includes(num.number)
          );
          if (replaceableIndex !== -1) {
            clue.numbers[replaceableIndex].number = codeDigit;
            usedDigits.add(codeDigit);
            break;
          }
        }
      }
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
    this.disableResetButton = this.isResetButtonDisabled();
  }

  markAsMisplaced(): void {
    if (!this.selectedNumber) return;

    this.selectedNumber.state =
      this.selectedNumber.state === 'misplaced' ? 'default' : 'misplaced';
    this.selectedNumber.selected = false;
    this.disableMarkUpButtons = true;
    this.selectedNumber = null;
    this.disableMarkAllAsWrongButton = this.isMarkAllAsWrongButtonDisabled();
    this.disableResetButton = this.isResetButtonDisabled();
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
    this.disableResetButton = this.isResetButtonDisabled();
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

  isResetButtonDisabled(): boolean {
    let areAllNumbersDefault: boolean = true;
    for (let i = 0; i < this.clues.length; i++) {
      const clue = this.clues[i];
      for (let j = 0; j < clue.numbers.length; j++) {
        const number = clue.numbers[j];
        if (number.state !== 'default') {
          areAllNumbersDefault = false;
          break;
        }
      }
    }

    return areAllNumbersDefault;
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
    this.disableResetButton = this.isResetButtonDisabled();
  }

  resetMarkUps(): void {
    this.clues.forEach((clue) => {
      clue.numbers.forEach((number) => {
        number.state = 'default';
      });
    });

    this.codeForm.reset();

    this.disableMarkAllAsWrongButton = false;
    this.disableResetButton = true;
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

  newGame(): void {
    this.code = '';
    this.generateCode();
    this.resetMarkUps();
  }
}
