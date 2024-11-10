export function replacePolishCharacters(str: string): string {
  const polishChars: Record<string, string> = {
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ź: "z",
    ż: "z",
    Ą: "A",
    Ć: "C",
    Ę: "E",
    Ł: "L",
    Ń: "N",
    Ó: "O",
    Ś: "S",
    Ź: "Z",
    Ż: "Z",
  };

  return str.replace(
    /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g,
    (match: string) => polishChars[match] || match
  );
}

export function hasExactLetters(input: string, numLetters: number): boolean {
  // Remove all spaces from the input string
  const cleanedString = input.replace(/\s+/g, "");

  // Check if the length of the cleaned string matches the specified number of letters
  return cleanedString.length === numLetters;
}
