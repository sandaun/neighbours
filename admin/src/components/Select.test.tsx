import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, test, vi } from 'vitest';

import { Select } from './Select';

function Harness({ onChange = vi.fn() }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <>
      <label htmlFor="unit">Pis</label>
      <Select
        id="unit"
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
        options={[
          { value: '', label: 'Tots els pisos' },
          { value: 'u1', label: '1r 1a' },
          { value: 'u2', label: '2n 2a' },
        ]}
      />
    </>
  );
}

test('is labelled and shows the selected option', () => {
  render(<Harness />);
  expect(screen.getByRole('combobox', { name: 'Pis' })).toHaveTextContent('Tots els pisos');
});

test('works with the keyboard and maps the empty option back to ""', async () => {
  const onChange = vi.fn();
  render(<Harness onChange={onChange} />);
  const trigger = screen.getByRole('combobox', { name: 'Pis' });
  trigger.focus();

  await userEvent.keyboard('{ArrowDown}');
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
  expect(onChange).toHaveBeenLastCalledWith('u2');
  expect(trigger).toHaveTextContent('2n 2a');
  expect(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('option', { name: 'Tots els pisos' }));
  expect(onChange).toHaveBeenLastCalledWith('');
});
