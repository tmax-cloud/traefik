import * as _ from 'lodash';
import * as classnames from 'classnames';
import * as React from 'react';
import { JSONSchema7 } from 'json-schema';
import { getUiOptions } from '@rjsf/core/lib/utils';
import { FieldProps, UiSchema } from '@rjsf/core';
//import { FieldProps, UiSchema } from 'react-jsonschema-form';
//import SchemaField, { SchemaFieldProps } from 're';
import { LinkifyExternal, SelectorInput, Dropdown } from '@console/internal/components/utils';
import { ClusterClaimModel } from '@console/internal/models';
import { AccordionContent, AccordionItem, AccordionToggle, Switch } from '@patternfly/react-core';
import { MatchExpressions } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/match-expressions';
import { ResourceRequirements } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/resource-requirements';
import { AdditionalPropertyFields } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/additional-properties';
import { OneOfFields } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/oneOf';
import { ProviderDropdownFields } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/providerDropdown';
import { ConfigureUpdateStrategy, UPDATE_STRATEGY_DESCRIPTION } from '@console/internal/components/modals/configure-update-strategy-modal';
import { NodeAffinity, PodAffinity } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/affinity';
import { getSchemaErrors, useSchemaDescription, useSchemaLabel } from './utils';
import { useTranslation } from 'react-i18next';
import SchemaField, { SchemaFieldProps } from '@rjsf/core/lib/components/fields/SchemaField';

const Description = ({ id, description }) =>
  description ? (
    <span id={id} className="help-block">
      <LinkifyExternal>
        <div className="co-pre-line">{description}</div>
      </LinkifyExternal>
    </span>
  ) : null;

export const DescriptionField: React.FC<FieldProps> = ({ id, description }) => {
  const { t } = useTranslation();
  return <Description id={id} description={description && !description.includes(':') ? t(`DESCRIPTION:${description}`) : description} />;
};

export const FormField: React.FC<FormFieldProps> = ({ children, id, defaultLabel, required, schema, uiSchema }) => {
  const [showLabel, label] = useSchemaLabel(schema, uiSchema, defaultLabel || 'Value');
  return (
    <div id={`${id}_field`} className="form-group">
      {showLabel && label && (
        <label className={classnames('form-label', { 'co-required': required })} htmlFor={id}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
};

export const FieldSet: React.FC<FieldSetProps> = ({ children, defaultLabel, idSchema, required = false, schema, uiSchema }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);
  const [showLabel, label] = useSchemaLabel(schema, uiSchema, defaultLabel);
  const description = useSchemaDescription(schema, uiSchema);
  const onToggle = e => {
    e.preventDefault();
    setExpanded(current => !current);
  };
  return showLabel && label ? (
    <div id={`${idSchema.$id}_field-group`} className="form-group co-dynamic-form__field-group">
      <AccordionItem>
        <AccordionToggle id={`${idSchema.$id}_accordion-toggle`} onClick={onToggle} isExpanded={expanded}>
          <label className={classnames({ 'co-required': required })} htmlFor={`${idSchema.$id}_accordion-content`}>
            {_.startCase(label)}
          </label>
        </AccordionToggle>
        {description && <Description id={`${idSchema.$id}_description`} description={!description.includes(':') ? t(`DESCRIPTION:${description}`) : description} />}
        <AccordionContent id={`${idSchema.$id}_accordion-content`} isHidden={!expanded}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </div>
  ) : (
    <>{children}</>
  );
};

export const UpdateStrategyField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, required, schema, uiSchema }) => {
  const description = useSchemaDescription(schema, uiSchema, UPDATE_STRATEGY_DESCRIPTION);
  return (
    <FormField defaultLabel={name || 'Update Strategy'} id={idSchema.$id} required={required} schema={schema} uiSchema={uiSchema}>
      <Description description={description} id={idSchema.$id} />
      <ConfigureUpdateStrategy
        showDescription={false}
        strategyType={formData?.type || 'RollingUpdate'}
        maxUnavailable={formData?.rollingUpdate?.maxUnavailable || ''}
        maxSurge={formData?.rollingUpdate?.maxSurge || ''}
        onChangeStrategyType={type => onChange(_.set(_.cloneDeep(formData), 'type', type))}
        onChangeMaxUnavailable={maxUnavailable => onChange(_.set(_.cloneDeep(formData), 'rollingUpdate.maxUnavailable', maxUnavailable))}
        onChangeMaxSurge={maxSurge => onChange(_.set(_.cloneDeep(formData), 'rollingUpdate.maxSurge', maxSurge))}
        replicas={1}
        uid={idSchema.$id}
      />
    </FormField>
  );
};

export const NodeAffinityField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, required, schema, uiSchema }) => (
  <FieldSet defaultLabel={name || 'Node Affinity'} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
    <NodeAffinity affinity={formData} onChange={affinity => onChange(affinity)} uid={idSchema.$id} />
  </FieldSet>
);

export const PodAffinityField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, required, schema, uiSchema }) => (
  <FieldSet defaultLabel={name || 'Pod Affinity'} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
    <PodAffinity affinity={formData} onChange={affinity => onChange(affinity)} uid={idSchema.$id} />
  </FieldSet>
);

export const MatchExpressionsField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, required, schema, uiSchema }) => (
  <FieldSet defaultLabel={name || 'Match Expressions'} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
    <MatchExpressions matchExpressions={formData} onChange={v => onChange(v)} uid={idSchema.$id} />
  </FieldSet>
);

export const BooleanField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, uiSchema }) => {
  const { labelOn = 'true', labelOff = 'false' } = getUiOptions(uiSchema);
  return (
    <div>
      <Switch id={idSchema?.$id || name} key={idSchema?.$id || name} isChecked={_.isNil(formData) ? false : formData} onChange={v => onChange(v)} label={labelOn as string} labelOff={labelOff as string} />
    </div>
  );
};

export const LabelsField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, required, schema, uiSchema }) => (
  <FormField defaultLabel={name} id={idSchema.$id} required={required} schema={schema} uiSchema={uiSchema}>
    <SelectorInput inputProps={{ id: idSchema.$id }} onChange={newValue => onChange(SelectorInput.objectify(newValue))} tags={SelectorInput.arrayify(formData)} />
  </FormField>
);

export const ResourceRequirementsField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, required, schema, uiSchema }) => (
  <FieldSet defaultLabel={name || 'Resource Requirements'} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
    <dl id={idSchema.$id}>
      <dt>Limits</dt>
      <dd>
        <ResourceRequirements cpu={formData?.limits?.cpu || ''} memory={formData?.limits?.memory || ''} storage={formData?.limits?.['ephemeral-storage'] || ''} onChangeCPU={cpu => onChange(_.set(_.cloneDeep(formData), 'limits.cpu', cpu))} onChangeMemory={mem => onChange(_.set(_.cloneDeep(formData), 'limits.memory', mem))} onChangeStorage={sto => onChange(_.set(_.cloneDeep(formData), 'limits.ephemeral-storage', sto))} path={`${idSchema.$id}.limits`} />
      </dd>
      <dt>Requests</dt>
      <dd>
        <ResourceRequirements cpu={formData?.requests?.cpu || ''} memory={formData?.requests?.memory || ''} storage={formData?.requests?.['ephemeral-storage'] || ''} onChangeCPU={cpu => onChange(_.set(_.cloneDeep(formData), 'requests.cpu', cpu))} onChangeMemory={mem => onChange(_.set(_.cloneDeep(formData), 'requests.memory', mem))} onChangeStorage={sto => onChange(_.set(_.cloneDeep(formData), 'requests.ephemeral-storage', sto))} path={`${idSchema.$id}.requests`} />
      </dd>
    </dl>
  </FieldSet>
);
export const AdditionalPropertyField: React.FC<FieldProps> = props => {
  const { formData, idSchema, name, onChange, required, schema, uiSchema } = props;
  return (
    <FieldSet defaultLabel={name || 'Resource Requirements'} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
      <AdditionalPropertyFields formData={formData} onChange={properties => onChange(properties)} uid={idSchema.$id}></AdditionalPropertyFields>
    </FieldSet>
  );
};

export const OneOfField: React.FC<FieldProps> = props => {
  const { formData, idSchema, name, onChange, required, schema, uiSchema } = props;
  if (!name) {
    return <NullField />;
  }
  const changeItem = properties => {
    return onChange(properties);
  };
  return (
    <FieldSet defaultLabel={name} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
      <OneOfFields formData={formData} schema={schema} uid={idSchema.$id} onChange={changeItem}></OneOfFields>
    </FieldSet>
  );
};

export const ProviderDropdownField: React.FC<FieldProps> = props => {
  const { formData, idSchema, name, schema, formContext, onChange } = props;
  const kind = _.get(formContext, 'formData', 'kind');
  if (!name) {
    return <NullField />;
  }
  if (kind?.kind === ClusterClaimModel.kind) {
    // MEMO : ClusterClaim의 provider속성에 대해서만 provider선택 시 하위 spec필드 변경되도록 드롭다운 예외처리
    const items = {};
    if (Array.isArray(schema?.enum)) {
      schema?.enum?.forEach((item: string) => {
        items[item] = item;
      });
    }
    return <ProviderDropdownFields key={idSchema.$id} id={idSchema.$id} formData={formData} onChange={onChange} items={items} schema={schema} />;
  } else {
    return <DropdownField {...props} key={idSchema.$id} />;
  }
};

export const DropdownField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, schema, uiSchema = {} }) => {
  const { items, title } = getUiOptions(uiSchema);
  return <Dropdown id={idSchema.$id} key={idSchema.$id} title={`Select ${title || schema?.title || name}`} selectedKey={formData} items={items ?? {}} onChange={val => onChange(val)} />;
};

export const TextField: React.FC<FieldProps> = ({ formData, idSchema, name, onChange, onBlur, schema, uiSchema = {}, disabled = false, required = false, readonly = false }) => {
  return <input className="pf-c-form-control" disabled={disabled} id={idSchema.$id} key={idSchema.$id} onBlur={onBlur && (event => onBlur(idSchema.$id, event.target.value))} onChange={({ currentTarget }) => onChange(currentTarget.value)} readOnly={readonly} required={required} type="text" value={formData} />;
};

export const CustomSchemaField: React.FC<SchemaFieldProps> = props => {
  const errors = getSchemaErrors(props.schema ?? {});
  if (errors.length) {
    // eslint-disable-next-line no-console
    console.warn('DynamicForm component does not support the provided JSON schema: ', errors);
    return null;
  }

  return <SchemaField {...props} />;
};

export const NullField = () => null;

export default {
  TextField,
  AdditionalPropertyField,
  BooleanField,
  DescriptionField,
  DropdownField,
  LabelsField,
  MatchExpressionsField,
  NodeAffinityField,
  OneOfField,
  ProviderDropdownField,
  NullField,
  PodAffinityField,
  ResourceRequirementsField,
  SchemaField: CustomSchemaField,
  UpdateStrategyField,
};

type FormFieldProps = {
  id: string;
  defaultLabel?: string;
  required: boolean;
  schema: JSONSchema7;
  uiSchema: UiSchema;
};

type FieldSetProps = Pick<FieldProps, 'idSchema' | 'required' | 'schema' | 'uiSchema'> & {
  defaultLabel?: string;
};
