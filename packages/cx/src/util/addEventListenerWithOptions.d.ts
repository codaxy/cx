export function addEventListenerWithOptions(
   element: Element,
   event: string,
   callback: (event: Event) => void,
   options: AddEventListenerOptions
): () => void;
