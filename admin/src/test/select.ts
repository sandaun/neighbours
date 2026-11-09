import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Opens a Radix-based Select and picks an option by its visible label.
export async function chooseOption(trigger: HTMLElement, option: string | RegExp) {
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('option', { name: option }));
}
