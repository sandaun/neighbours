export const DEMO_EXPENSE_YEAR = 2026;

// Integer cents, January through December. These are community expense examples,
// independent of the resident's real balance, charges, and receipts.
export const DEMO_EXPENSES = [
  {
    key: 'elevator',
    monthlyCents: [
      32000, 32000, 32000, 32000, 32000, 32000, 32000, 32000, 32000, 32000, 32000, 32000,
    ],
  },
  {
    key: 'electricity',
    monthlyCents: [
      18000, 16000, 15000, 14000, 13000, 14000, 15000, 15000, 16000, 17000, 18000, 20000,
    ],
  },
  {
    key: 'garden',
    monthlyCents: [
      19000, 19000, 19000, 19000, 21000, 22000, 22000, 22000, 20000, 19000, 19000, 19000,
    ],
  },
  {
    key: 'cleaning',
    monthlyCents: [
      15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000,
    ],
  },
  {
    key: 'other',
    monthlyCents: [8000, 6000, 5000, 8000, 5000, 9000, 7000, 5000, 6000, 8000, 5000, 10000],
  },
] as const;
