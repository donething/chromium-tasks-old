import React from 'react';
import {render, screen} from '@testing-library/react';
import OptionsComp from './OptionsComp';

test('renders learn react link', () => {
  render(<OptionsComp/>);
  const linkElement = screen.getByText(/弹窗页面/i);
  expect(linkElement).toBeInTheDocument();
});
