export const LASSO_BUTTON = 201;

type Handler = (id: number) => void;
let handler: Handler | null = null;
let pending: number | null = null;

export function buttonPressed(id: number): void {
  if (handler) handler(id);
  else pending = id;
}

export function setButtonHandler(h: Handler | null): void {
  handler = h;
  if (h && pending !== null) {
    const id = pending;
    pending = null;
    h(id);
  }
}
