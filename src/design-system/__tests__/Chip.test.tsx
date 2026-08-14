import { fireEvent, render, screen } from '@testing-library/react-native';

import { Chip } from '../Chip';

describe('<Chip />', () => {
  test('exposes selection state and handles presses', async () => {
    const onPress = jest.fn();

    await render(
      <Chip selected onPress={onPress}>
        Elevator
      </Chip>
    );

    const chip = screen.getByRole('button', { name: 'Elevator' });
    fireEvent.press(chip);

    expect(chip.props.accessibilityState).toEqual({ selected: true });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
