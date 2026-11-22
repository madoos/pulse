import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** Opens a panel that starts closed, by its title, as a user would. */
export const openPanel = async (title: string) =>
  userEvent.click(await screen.findByRole('button', { name: title, expanded: false }));
