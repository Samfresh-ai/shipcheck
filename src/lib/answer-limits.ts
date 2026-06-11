export const MIN_ANSWER_CHARACTERS = 20;
export const MAX_ANSWER_CHARACTERS = 2_400;

export function answerLimitLabel() {
  return MAX_ANSWER_CHARACTERS.toLocaleString("en-US");
}
