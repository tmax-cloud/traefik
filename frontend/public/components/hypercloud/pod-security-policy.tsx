import * as React from 'react';
import * as classNames from 'classnames';

import { sortable } from '@patternfly/react-table';
import { K8sResourceKind, K8sResourceCommon, K8sClaimResourceKind, modelFor } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, navFactory, ResourceSummary, SectionHeading, ResourceLink, ResourceKebab } from '../utils';
import { useTranslation } from 'react-i18next';
const { common } = Kebab.factory;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

export const menuActions = [...Kebab.getExtensionsActionsForKind(modelFor('PodSecurityPolicy')), ...common];

const kind = 'PodSecurityPolicy';

const PodSecurityPolicyTableHeader = t => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_46'),
      sortField: 'spec.privileged',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_47'),
      sortField: 'spec.seLinux.rule',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_48'),
      sortField: 'spec.runAsUser.rule',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_49'),
      sortField: 'spec.fsGroup.rule',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_50'),
      sortField: 'spec.supplementalGroups.rule',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
PodSecurityPolicyTableHeader.displayName = 'PodSecurityPolicyTableHeader';

const PodSecurityPolicyTableRow: RowFunction<K8sClaimResourceKind> = ({ obj: podsecuritypolicies, index, key, style }) => {
  return (
    <TableRow id={podsecuritypolicies.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={podsecuritypolicies.metadata.name} namespace={podsecuritypolicies.metadata.namespace} title={podsecuritypolicies.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{podsecuritypolicies.spec.privileged ? 'True' : 'False'}</TableData>
      <TableData className={tableColumnClasses[2]}>{podsecuritypolicies.spec.seLinux.rule}</TableData>
      <TableData className={tableColumnClasses[3]}>{podsecuritypolicies.spec.runAsUser.rule}</TableData>
      <TableData className={tableColumnClasses[4]}>{podsecuritypolicies.spec.fsGroup.rule}</TableData>
      <TableData className={tableColumnClasses[5]}>{podsecuritypolicies.spec.supplementalGroups.rule}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={podsecuritypolicies} />
      </TableData>
    </TableRow>
  );
};

export const PodSecurityPoliciesList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="PodSecurityPolicies" Header={PodSecurityPolicyTableHeader.bind(null, t)} Row={PodSecurityPolicyTableRow} virtualize />;
};
PodSecurityPoliciesList.displayName = 'PodSecurityPoliciesList';

export const PodSecurityPoliciesPage: React.FC<PodSecurityPoliciesPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_78')} kind={'PodSecurityPolicy'} canCreate={true} ListComponent={PodSecurityPoliciesList} {...props} />;
};
PodSecurityPoliciesPage.displayName = 'PodSecurityPoliciesPage';

export const PodSecurityPoliciesDetailsList: React.FC<PodSecurityPoliciesDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();

  return (
    <dl className="co-m-pane__details">
      <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_46')} obj={ds} path="spec.privileged">
        {ds.spec.privileged ? 'True' : 'False'}
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_47')} obj={ds} path="spec.seLinux.rule">
        {ds.spec.seLinux.rule}
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_48')} obj={ds} path="spec.runAsUser.rule">
        {ds.spec.runAsUser.rule}
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_49')} obj={ds} path="spec.fsGroup.rule">
        {ds.spec.fsGroup.rule}
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_50')} obj={ds} path="spec.supplementalGroups.rule">
        {ds.spec.supplementalGroups.rule}
      </DetailsItem>
    </dl>
  );
};

const PodSecurityPoliciesDetails: React.FC<PodSecurityPoliciesDetailsProps> = ({ obj: podsecuritypolicies }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t('COMMON:MSG_LNB_MENU_78') })} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={podsecuritypolicies}></ResourceSummary>
            </div>
            <div className="col-lg-6">
              <PodSecurityPoliciesDetailsList ds={podsecuritypolicies} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
PodSecurityPoliciesDetails.displayName = 'PodSecurityPoliciesDetails';

const { details, editResource } = navFactory;
export const PodSecurityPoliciesDetailsPage: React.FC<PodSecurityPoliciesDetailsPageProps> = props => <DetailsPage {...props} kind={'PodSecurityPolicy'} menuActions={menuActions} pages={[details(PodSecurityPoliciesDetails), editResource()]} />;
PodSecurityPoliciesDetailsPage.displayName = 'PodSecurityPoliciesDetailsPage';

type PodSecurityPoliciesDetailsProps = {
  obj: K8sResourceCommon;
};

type PodSecurityPoliciesDetailsListProps = {
  ds: K8sResourceKind;
};

type PodSecurityPoliciesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type PodSecurityPoliciesDetailsPageProps = {
  match: any;
};
