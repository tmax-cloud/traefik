import * as _ from 'lodash';
import { K8sKind, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { KebabOption } from '@console/internal/components/utils';

const healthChecksAdded = (resource: K8sResourceKind): boolean => {
  const containers = resource?.spec?.template?.spec?.containers;
  return _.every(containers, container => container.readinessProbe || container.livenessProbe || container.startupProbe);
};

const healthChecksUrl = (model: K8sKind, obj: K8sResourceKind): string => {
  const {
    metadata: { name, namespace },
  } = obj;
  const resourcePlural = model.crd ? referenceFor(obj) : model.plural;
  const containers = obj?.spec?.template?.spec?.containers;
  const containerName = containers?.[0]?.name;
  return `/k8s/ns/${namespace}/${resourcePlural}/${name}/containers/${containerName}/health-checks`;
};

export const AddHealthChecks = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    label: 'COMMON:MSG_MAIN_ACTIONBUTTON_14',
    hidden: healthChecksAdded(obj),
    href: healthChecksUrl(model, obj),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};

export const EditHealthChecks = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    label: 'COMMON:MSG_MAIN_ACTIONBUTTON_9',
    hidden: !healthChecksAdded(obj),
    href: healthChecksUrl(model, obj),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};
