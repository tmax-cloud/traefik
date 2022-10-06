import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { connectToFlags } from '../reducers/features';
import { FLAGS } from '@console/shared';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary, Selector, ExternalLink } from './utils';
import { NetworkPolicyModel } from '../models';
import { getNetworkPolicyDocLink } from './utils/documentation';
import { useTranslation } from 'react-i18next';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(NetworkPolicyModel), ...common];

const tableColumnClasses = [classNames('col-sm-4', 'col-xs-6'), classNames('col-sm-4', 'col-xs-6'), classNames('col-sm-4', 'hidden-xs'), Kebab.columnClass];

const NetworkPolicyTableHeader = t => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_16'),
      sortField: 'spec.podSelector',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
NetworkPolicyTableHeader.displayName = 'NetworkPolicyTableHeader';

const kind = 'NetworkPolicy';

const NetworkPolicyTableRow = ({ obj: np, index, key, style }) => {
  return (
    <TableRow id={np.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={np.metadata.name} namespace={np.metadata.namespace} title={np.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind={'Namespace'} name={np.metadata.namespace} title={np.metadata.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>{_.isEmpty(np.spec.podSelector) ? <Link to={`/search/ns/${np.metadata.namespace}?kind=Pod`}>{`All pods within ${np.metadata.namespace}`}</Link> : <Selector selector={np.spec.podSelector} namespace={np.metadata.namespace} />}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={np} />
      </TableData>
    </TableRow>
  );
};

const NetworkPoliciesList = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Network Policies" Header={NetworkPolicyTableHeader.bind(null, t)} Row={NetworkPolicyTableRow} virtualize />;
};

export const NetworkPoliciesPage = props => {
  const { t } = useTranslation();
  return <ListPage {...props} title={t('COMMON:MSG_LNB_MENU_49')} ListComponent={NetworkPoliciesList} kind={kind} canCreate={true} />;
};

const IngressHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="row co-m-table-grid__head">
      <div className="col-xs-4">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_INGRESSRULES_3')}</div>
      <div className="col-xs-5">From</div>
      <div className="col-xs-3">To Ports</div>
    </div>
  );
};
const EgressHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="row co-m-table-grid__head">
      <div className="col-xs-4">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_INGRESSRULES_3')}</div>
      <div className="col-xs-5">To</div>
      <div className="col-xs-3">To Ports</div>
    </div>
  );
};



const IngressRow = ({ ingress, namespace, podSelector }) => {
  const { t } = useTranslation();
  const podSelectors = [];
  const nsSelectors = [];
  const ipBlocks = [];

  const style = { margin: '5px 0' };
  _.each(ingress.from, ({ namespaceSelector, podSelector: ps, ipBlock }, index) => {
    if (namespaceSelector) {
      nsSelectors.push(
        <div key={index} style={style}>
          <Selector selector={namespaceSelector} kind="Namespace" />
        </div>,
      );
    } else if (ps) {
      podSelectors.push(
        <div key={index} style={style}>
          <Selector selector={ps} namespace={namespace} />
        </div>,
      );
    } else if (ipBlock) {
      ipBlocks.push(
        <div key={index} style={style}>
          {ipBlock?.cidr && <div>cidr={ipBlock?.cidr}</div>}          
          {ipBlock?.except && <div>except={ipBlock?.except}</div>}          
        </div>,
      );
    }
  });
  return (
    <div className="row co-resource-list__item">
      <div className="col-xs-4">
        <div>
          <span className="text-muted">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_1')}</span>
        </div>
        <div style={style}>
          <Selector selector={podSelector} namespace={namespace} />
        </div>
      </div>
      <div className="col-xs-5">
        <div>
          { !_.isEmpty(podSelectors) &&
            <div>
              <span className="text-muted">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_1')}</span>
              {podSelectors}
            </div>
          }
          { !_.isEmpty(nsSelectors) &&
            <div style={{ paddingTop: podSelectors.length ? 10 : 0 }}>
              <span className="text-muted">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_2')}</span>
              {nsSelectors}
            </div>
          }
          { !_.isEmpty(ipBlocks) &&
            <div style={{ paddingTop: podSelectors.length ? 10 : 0 }}>
              <span className="text-muted">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_3')}</span>
              {ipBlocks}
            </div>
          }
        </div>
      </div>
      <div className="col-xs-3">
        {_.map(ingress.ports, (port, k) => (
          <p key={k}>
            {port.protocol}/{port.port}
          </p>
        ))}
      </div>
    </div>
  );
};

const EgressRow = ({ egress, namespace, podSelector }) => {
  const { t } = useTranslation();
  const podSelectors = [];
  const nsSelectors = [];
  const ipBlocks = [];

  const style = { margin: '5px 0' };
  _.each(egress.to, ({ namespaceSelector, podSelector: ps, ipBlock }, index) => {
    if (namespaceSelector) {
      nsSelectors.push(
        <div key={index} style={style}>
          <Selector selector={namespaceSelector} kind="Namespace" />
        </div>,
      );
    } else if (ps) {
      podSelectors.push(
        <div key={index} style={style}>
          <Selector selector={ps} namespace={namespace} />
        </div>,
      );
    } else if (ipBlock) {
      ipBlocks.push(
        <div key={index} style={style}>
          {ipBlock?.cidr && <div>cidr={ipBlock?.cidr}</div>}          
          {ipBlock?.except && <div>except={ipBlock?.except}</div>}          
        </div>,
      );
    }
  });
  return (
    <div className="row co-resource-list__item">
      <div className="col-xs-4">
        <div>
          <span className="text-muted">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_1')}</span>
        </div>
        <div style={style}>
          <Selector selector={podSelector} namespace={namespace} />
        </div>
      </div>
      <div className="col-xs-5">
        <div>
          { !_.isEmpty(podSelectors) &&
            <div>
              <span className="text-muted">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_1')}</span>
              {podSelectors}
            </div>
          }
          { !_.isEmpty(nsSelectors) &&
            <div style={{ paddingTop: podSelectors.length ? 10 : 0 }}>
              <span className="text-muted">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_2')}</span>
              {nsSelectors}
            </div>
          }
          { !_.isEmpty(ipBlocks) &&
            <div style={{ paddingTop: podSelectors.length ? 10 : 0 }}>
              <span className="text-muted">{t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_3')}</span>
              {ipBlocks}
            </div>
          }
        </div>
      </div>
      <div className="col-xs-3">
        {_.map(egress.ports, (port, k) => (
          <p key={k}>
            {port.protocol}/{port.port}
          </p>
        ))}
      </div>
    </div>
  );
};

const Details_ = ({ obj: np, flags }) => {
  const { t } = useTranslation();
  const ingress_explanation = t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_INGRESSRULES_1', { 0: '~~'});
  const egress_explanation = t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_EGRESSRULES_1', { 0: '~~'});
  const namespace = np.metadata.namespace;

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t('COMMON:MSG_LNB_MENU_49') })} />
        <ResourceSummary resource={np} podSelector={'spec.podSelector'} showPodSelector />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_INGRESSRULES_1')} />
        <p className="co-m-pane__explanation">
          {ingress_explanation.split('~~')[0]}
          <ExternalLink href={getNetworkPolicyDocLink(flags[FLAGS.OPENSHIFT])} text="Network Policies Documentation" />
          {ingress_explanation.split('~~')[1]}          
        </p>
        {_.isEmpty(np.spec?.ingress) ? (          
          t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_INGRESSRULES_2', { 0: namespace})
        ) : (
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <IngressHeader />
            <div className="co-m-table-grid__body">
              {_.map(np.spec.ingress, (ingress, i) => (
                <IngressRow key={i} ingress={ingress} podSelector={np.spec.podSelector} namespace={np.metadata.namespace} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_4')} />
        <p className="co-m-pane__explanation">
          {egress_explanation.split('~~')[0]}
          <ExternalLink href={getNetworkPolicyDocLink(flags[FLAGS.OPENSHIFT])} text="Network Policies Documentation" />
          {egress_explanation.split('~~')[1]}          
        </p>
        {_.isEmpty(np.spec?.egress) ? (          
          t('SINGLE:MSG_NETWORKPOLICIES_NETWORKPOLICYDETAILS_TABDETAILS_EGRESSRULES_2', { 0: namespace})
        ) : (
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <EgressHeader />
            <div className="co-m-table-grid__body">
              {_.map(np.spec.egress, (egress, i) => (
                <EgressRow key={i} egress={egress} podSelector={np.spec.podSelector} namespace={np.metadata.namespace} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const Details = connectToFlags(FLAGS.OPENSHIFT)(Details_);

export const NetworkPoliciesDetailsPage = props => <DetailsPage {...props} menuActions={menuActions} pages={[navFactory.details(Details), navFactory.editResource()]} />;
