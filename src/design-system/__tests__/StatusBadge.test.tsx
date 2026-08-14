import { render, screen } from '@testing-library/react-native';

import { StatusBadge, type IncidentStatus } from '../StatusBadge';

const CASES: { status: IncidentStatus; label: string }[] = [
  { status: 'received', label: 'Received' },
  { status: 'in-progress', label: 'In progress' },
  { status: 'resolved', label: 'Resolved' },
];

describe('<StatusBadge />', () => {
  test.each(CASES)('renders the $status label', async ({ status, label }) => {
    await render(<StatusBadge label={label} status={status} />);

    expect(screen.getByText(label)).toBeTruthy();
  });
});
