import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { useFormContext } from 'react-hook-form';

export const RadioInput: React.SFC<RadioInputProps> = props => {
  const { register } = props.methods ? props.methods : useFormContext();
  const inputProps: React.InputHTMLAttributes<any> = _.omit(props, ['title', 'subTitle', 'desc', 'children', 'inline']);
  const defaultChecked = props.initvalue === props.item ? true : false;
  const inputElement = (
    <>
      <label className={classNames({ 'radio-inline': props.inline, 'co-disabled': props.disabled })}>
        <input type="radio" ref={register} value={props.item} defaultChecked={defaultChecked} {...inputProps} />
        {props.title} {props.subTitle && <span className="co-no-bold">{props.subTitle}</span>}
      </label>
      {props.desc && <p className="co-m-radio-desc text-muted">{props.desc}</p>}
      {props.children}
    </>
  );

  return props.inline ? inputElement : <div className="radio">{inputElement}</div>;
};

export const RadioGroup: React.SFC<RadioGroupProps> = ({ inline = false, items, id = JSON.stringify(items), name, methods, initValue }) => {
  const radios = items.map(({ desc, title, subTitle, value, disabled }) => <RadioInput name={name} key={value} initvalue={initValue} desc={desc} title={title} subTitle={subTitle} item={value} disabled={disabled} inline={inline} methods={methods} />);
  return <div className={classNames('co-radio-group', { 'co-radio-group--inline': inline })}>{radios}</div>;
};

export type RadioInputProps = {
  item: string;
  desc?: string | JSX.Element;
  subTitle?: string | JSX.Element;
  disabled?: boolean;
  methods?: any;
  inline?: boolean;
  initvalue?: string;
} & React.InputHTMLAttributes<any>;

export type RadioGroupProps = {
  name: string;
  items: ({
    desc?: string | JSX.Element;
    title: string | JSX.Element;
    subTitle?: string | JSX.Element;
    value: string;
    disabled?: boolean;
  } & React.InputHTMLAttributes<any>)[];
  id?: string;
  methods?: any;
  inline?: boolean;
  initValue?: string;
};

RadioInput.displayName = 'RadioInput';
RadioGroup.displayName = 'RadioGroup';
