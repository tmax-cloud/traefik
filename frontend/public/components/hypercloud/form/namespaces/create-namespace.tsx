import * as _ from 'lodash-es';
import * as React from 'react';
import { match as RMatch } from 'react-router';
import { useFormContext, Controller } from 'react-hook-form';
import { WithCommonForm } from '../create-form';
import { Section } from '../../utils/section';
import { SelectorInput } from '../../../utils';

// const allow = 'allow';
// const deny = 'deny';

// const defaultDeny = {
//   apiVersion: 'networking.k8s.io/v1',
//   kind: 'NetworkPolicy',
//   spec: {
//     podSelector: null,
//   },
// };

const defaultValues = {
  metadata: {
    name: 'example-name',
  },
};

const namespaceFormFactory = params => {
  return WithCommonForm(CreateNamespaceComponent, params, defaultValues);
};

const CreateNamespaceComponent: React.FC<NamespaceFormProps> = props => {
  const { control } = useFormContext();
  return (
    <Section label="Labels" id="label" description="이것은 Label입니다.">
      <Controller name="metadata.labels" id="label" labelClassName="co-text-sample" as={SelectorInput} control={control} tags={[]} />
    </Section>
    /* <div className="form-group">
      <label htmlFor="network-policy" className="control-label">
        Default Network Policy
              </label>
      <div className="modal-body__field ">
        <Dropdown
          selectedKey={this.state.np}
          items={defaultNetworkPolicies}
          dropDownClassName="dropdown--full-width"
          id="dropdown-selectbox"
          onChange={(np) => this.setState({ np })}
        />
      </div>
    </div> */
  );
};

export const CreateNamespace: React.FC<CreateNamespaceProps> = props => {
  const formComponent = namespaceFormFactory(props.match.params);
  const NamespaceFormComponent = formComponent;
  return <NamespaceFormComponent fixed={{}} explanation={''} titleVerb="Create" onSubmitCallback={onSubmitCallback} isCreate={true} />;
};

export const onSubmitCallback = data => {
  let labels = SelectorInput.objectify(data.metadata.labels);
  delete data.metadata.labels;
  data = _.defaultsDeep({ metadata: { labels: labels } }, data);
  return data;
};

type CreateNamespaceProps = {
  match: RMatch<{
    type?: string;
  }>;
  fixed: object;
  explanation: string;
  titleVerb: string;
  saveButtonText?: string;
  isCreate: boolean;
};

type NamespaceFormProps = {
  onChange: Function;
  stringData: {
    [key: string]: string;
  };
  isCreate: boolean;
};
