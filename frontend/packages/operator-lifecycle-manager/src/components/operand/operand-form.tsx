import { JSONSchema7 } from 'json-schema';
// import { JSONSchema7 } from '@rjsf/core';
import { k8sCreate, k8sUpdate, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { history, useScrollToTopOnMount } from '@console/internal/components/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { ClusterServiceVersionKind, CRDDescription, APIServiceDefinition } from '../../types';
import { ClusterServiceVersionLogo } from '../index';
import { DynamicForm } from '@console/shared/src/components/dynamic-form';
import { getUISchema } from './utils';
import { FileUploadWidget } from '@console/shared/src/components/dynamic-form/widgets';

export const OperandForm: React.FC<OperandFormProps> = ({ csv, formData, match, model, next, onChange, providedAPI, prune, schema, create }) => {
  const [errors, setErrors] = React.useState<string[]>([]);
  // const [formData, setFormData] = React.useState(initialData);

  const processFormData = ({ metadata, ...rest }) => {
    const data = {
      metadata: {
        ...metadata,
        ...(match?.params?.ns && model.namespaced && { namespace: match.params.ns }),
      },
      ...rest,
    };
    return prune?.(data) ?? data;
  };

  const handleSubmit = ({ formData: submitFormData }) => {
    create
      ? k8sCreate(model, processFormData(submitFormData))
          .then(() => {
            if (next) {
              next += `/${submitFormData.metadata.name}`;
              history.push(next);
            }
          })
          .catch(e => setErrors([e.message]))
      : k8sUpdate(model, processFormData(submitFormData))
          .then(() => {
            if (next) {
              next += `/${submitFormData.metadata.name}`;
              history.push(next);
            }
          })
          .catch(e => setErrors([e.message]));
  };

  const uiSchema = React.useMemo(() => getUISchema(schema, providedAPI), [schema, providedAPI]);

  useScrollToTopOnMount();

  return (
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-md-0 col-md-push-12 col-lg-1 col-lg-push-11">
          {csv && providedAPI && (
            <div style={{ marginBottom: '30px' }}>
              <ClusterServiceVersionLogo displayName={providedAPI.displayName} icon={_.get(csv, 'spec.icon[0]')} provider={_.get(csv, 'spec.provider')} />
              {providedAPI.description}
            </div>
          )}
        </div>
        <div className="col-md-12 col-md-pull-0 col-lg-11 col-lg-pull-1">
          <DynamicForm noValidate errors={errors} formContext={{ namespace: match.params.ns }} uiSchema={uiSchema} formData={formData} onChange={onChange} onError={setErrors} onSubmit={handleSubmit} schema={schema as any} create={create} widgets={{ fileUploadWidget: FileUploadWidget }} />
        </div>
      </div>
    </div>
  );
};

type ProvidedAPI = CRDDescription | APIServiceDefinition;

export type OperandFormProps = {
  formData?: K8sResourceKind;
  onChange?: (formData?: any) => void;
  match: { params: { ns: string } };
  next?: string;
  csv: ClusterServiceVersionKind;
  model: K8sKind;
  providedAPI: ProvidedAPI;
  prune?: (data: any) => any;
  schema: JSONSchema7;
  create?: boolean;
};
