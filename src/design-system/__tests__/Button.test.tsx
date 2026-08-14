import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';

describe('<Button />', () => {
  test('exposes its label and handles presses', async () => {
    const onPress = jest.fn();

    await render(<Button onPress={onPress}>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('blocks presses while disabled', async () => {
    const onPress = jest.fn();

    await render(
      <Button disabled onPress={onPress}>
        Save
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.press(button);

    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });
    expect(onPress).not.toHaveBeenCalled();
  });
});
