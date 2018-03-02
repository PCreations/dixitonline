/*global expect jest*/
import React from 'react';
import { shallow } from 'enzyme';
import { MISSING_FIELD, BAD_FORMAT, PASSWORDS_MISSMATCH } from '../model';
import InputField, { ErrorMessage } from '../InputField';

describe('InputField', () => {
  test('should call given onChange callback property on change event', () => {
    const onChange = jest.fn();
    const wrapper = shallow(<InputField type="text" onChange={onChange} />);
    wrapper.find('input').simulate('change', { target: { value: 'foo' } });
    expect(onChange).toHaveBeenCalledWith({ target: { value: 'foo' } });
  });
  test('should render a ErrorMessage with the given error props if any', () => {
    const wrapper = shallow(<InputField type="text" error={MISSING_FIELD} />);
    const expectedErrorMessage = wrapper.find(ErrorMessage);
    expect(expectedErrorMessage.exists()).toBe(true);
    expect(expectedErrorMessage.props().error).toBe(MISSING_FIELD);
  });
});
