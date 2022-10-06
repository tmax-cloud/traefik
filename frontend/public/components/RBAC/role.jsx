import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
// import { Link } from 'react-router-dom';
import { RoleModel, RoleBindingModel } from '../../models';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { flatten as bindingsFlatten } from './bindings';
import { BindingName, BindingsList, RulesList } from './index';
import { DetailsPage, MultiListPage, TextFilter, Table, TableRow, TableData } from '../factory';
import { Kebab, SectionHeading, EmptyBox, navFactory, ResourceKebab, ResourceLink, Timestamp } from '../utils';
import { useTranslation, withTranslation } from 'react-i18next';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

export const isSystemRole = role => _.startsWith(role.metadata.name, 'system:');

// const addHref = (name, ns) => ns ? `/k8s/ns/${ns}/roles/${name}/add-rule` : `/k8s/cluster/clusterroles/${name}/add-rule`;

export const roleKind = role => (role.metadata.namespace ? 'Role' : 'ClusterRole');

const roleColumnClasses = [classNames('col-xs-6'), classNames('col-xs-6'), Kebab.columnClass];

const RolesTableHeader = t => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: roleColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: roleColumnClasses[1] },
    },
    { title: '', props: { className: roleColumnClasses[2] } },
  ];
};
RolesTableHeader.displayName = 'RolesTableHeader';

const RolesTableRow = (t, { obj: role, index, key, style }) => {
  const menuActions = [
    // This page is temporarily disabled until we update the safe resources list.
    // (kind, role) => ({
    //   label: 'Add Rule',
    //   href: addHref(role.metadata.name, role.metadata.namespace),
    // }),
    (kind, role) => ({
      label: roleKind(role) === 'Role' ? t('COMMON:MSG_COMMON_ACTIONBUTTON_52') : t('COMMON:MSG_COMMON_ACTIONBUTTON_52'),
      href: `/k8s/cluster/rolebindings/~new?rolekind=${roleKind(role)}&rolename=${role.metadata.name}`,
    }),
    Kebab.factory.Edit,
    Kebab.factory.Delete,
  ];
  console.log(roleKind(role));
  return (
    <TableRow id={role.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={roleColumnClasses[0]}>
        <ResourceLink kind={roleKind(role)} name={role.metadata.name} namespace={role.metadata.namespace} />
      </TableData>
      <TableData className={classNames(roleColumnClasses[1], 'co-break-word')}>{role.metadata.namespace ? <ResourceLink kind="Namespace" name={role.metadata.namespace} /> : 'All Namespaces'}</TableData>
      <TableData className={roleColumnClasses[2]}>
        <ResourceKebab actions={menuActions} kind={roleKind(role)} resource={role} />
      </TableData>
    </TableRow>
  );
};

class Details extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.changeFilter = val => this.setState({ ruleFilter: val });
  }
  render() {
    const ruleObj = this.props.obj;
    const { creationTimestamp, name, namespace } = ruleObj.metadata;
    const { ruleFilter } = this.state;
    const { t } = this.props;
    let rules = ruleObj.rules;
    if (ruleFilter) {
      const fuzzyCaseInsensitive = (a, b) => fuzzy(_.toLower(a), _.toLower(b));
      const searchKeys = ['nonResourceURLs', 'resources', 'verbs'];
      rules = rules.filter(rule => searchKeys.some(k => _.some(rule[k], v => fuzzyCaseInsensitive(ruleFilter, v))));
    }
    return (
      <div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t('COMMON:MSG_LNB_MENU_75') })} />
          <div className="row">
            <div className="col-xs-6">
              <dl className="co-m-pane__details">
                <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_115')}</dt>
                <dd>{name}</dd>
                {namespace && (
                  <div>
                    <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_6')}</dt>
                    <dd>
                      <ResourceLink kind="Namespace" name={namespace} />
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="col-xs-6">
              <dl className="co-m-pane__details">
                <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_43')}</dt>
                <dd>
                  <Timestamp timestamp={creationTimestamp} />
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_RULES_1')} />
          <div className="co-m-pane__filter-bar co-m-pane__filter-bar--alt">
            {/* This page is temporarily disabled until we update the safe resources list.
        <div className="co-m-pane__filter-bar-group">
          <Link to={addHref(name, namespace)} className="co-m-primary-action">
            <button className="btn btn-primary">Add Rule</button>
          </Link>
        </div>
        */}
            <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
              <TextFilter label={t('COMMON:MSG_COMMON_SEARCH_PLACEHOLDER_2')} onChange={this.changeFilter} />
            </div>
          </div>
          <RulesList rules={rules} name={name} namespace={namespace} />
        </div>
      </div>
    );
  }
}

const bindingsColumnClasses = [classNames('col-xs-4'), classNames('col-xs-2'), classNames('col-xs-4'), classNames('col-xs-2')];

// const BindingsTableHeader = () => {
//   return [
//     {
//       title: 'Name',
//       sortField: 'metadata.name',
//       transforms: [sortable],
//       props: { className: bindingsColumnClasses[0] },
//     },
//     {
//       title: 'Subject Kind',
//       sortField: 'subject.kind',
//       transforms: [sortable],
//       props: { className: bindingsColumnClasses[1] },
//     },
//     {
//       title: 'Subject Name',
//       sortField: 'subject.name',
//       transforms: [sortable],
//       props: { className: bindingsColumnClasses[2] },
//     },
//     {
//       title: 'Namespace',
//       sortField: 'metadata.namespace',
//       transforms: [sortable],
//       props: { className: bindingsColumnClasses[3] },
//     },
//   ];
// };
// BindingsTableHeader.displayName = 'BindingsTableHeader';

// const BindingsTableRow = ({ obj: binding, index, key, style }) => {
//   return (
//     <TableRow id={binding.metadata.uid} index={index} trKey={key} style={style}>
//       <TableData className={bindingsColumnClasses[0]}>
//         <BindingName binding={binding} />
//       </TableData>
//       <TableData className={bindingsColumnClasses[1]}>{binding.subject.kind}</TableData>
//       <TableData className={bindingsColumnClasses[2]}>{binding.subject.name}</TableData>
//       <TableData className={bindingsColumnClasses[3]}>{binding.namespace || 'All Namespaces'}</TableData>
//     </TableRow>
//   );
// };

const BindingsListComponent = props => <BindingsList {...props} virtualize />;

export const BindingsForRolePage = props => {
  const {
    match: {
      params: { name, ns },
    },
    obj: { kind },
  } = props;
  const { t } = useTranslation();
  const resources = [{ kind: 'RoleBinding', namespaced: true }];
  if (!ns) {
    resources.push({ kind: 'ClusterRoleBinding', namespaced: false, optional: true });
  }
  return (
    <MultiListPage
      canCreate={true}
      createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: ResourceLabel(RoleBindingModel, t) })}
      createProps={{
        to: `/k8s/${ns ? `ns/${ns}` : 'cluster'}/rolebindings/~new?rolekind=${kind}&rolename=${name}`,
      }}
      ListComponent={BindingsListComponent}
      staticFilters={[{ 'role-binding-roleRef-name': name }, { 'role-binding-roleRef-kind': kind }]}
      resources={resources}
      textFilter="role-binding"
      filterLabel="by role or subject"
      namespace={ns}
      flatten={bindingsFlatten}
      isClusterScope
    />
  );
};

export const RolesDetailsPage = props => {
  const { t } = useTranslation();
  const menuActions = [
    // This page is temporarily disabled until we update the safe resources list.
    // (kind, role) => ({
    //   label: 'Add Rule',
    //   href: addHref(role.metadata.name, role.metadata.namespace),
    // }),
    (kind, role) => ({
      label: t('COMMON:MSG_COMMON_ACTIONBUTTON_52'),
      href: `/k8s/cluster/rolebindings/~new?rolekind=${roleKind(role)}&rolename=${role.metadata.name}`,
    }),
    Kebab.factory.Edit,
    Kebab.factory.Delete,
  ];
  return <DetailsPage {...props} pages={[navFactory.details(withTranslation()(Details)), navFactory.editResource(), { href: 'bindings', name: t('COMMON:MSG_DETAILS_TAB_14'), component: BindingsForRolePage }]} menuActions={menuActions} />;
};

export const ClusterRolesDetailsPage = RolesDetailsPage;

const EmptyMsg = () => {
  const { t } = useTranslation();
  return <EmptyBox label={ResourceLabel(RoleModel, t) } />;
};

const RolesList = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Roles" EmptyMsg={EmptyMsg} Header={RolesTableHeader.bind(null, t)} Row={RolesTableRow.bind(null, t)} virtualize />;
};

export const roleType = role => {
  if (!role) {
    return undefined;
  }
  if (isSystemRole(role)) {
    return 'system';
  }
  return role.metadata.namespace ? 'namespace' : 'cluster';
};

export const RolesPage = ({ namespace, mock, showTitle }) => {
  const { t } = useTranslation();
  const createNS = namespace || 'default';
  const accessReview = {
    model: RoleModel,
    namespace: createNS,
  };
  return (
    <MultiListPage
      ListComponent={RolesList}
      canCreate={true}
      showTitle={showTitle}
      namespace={namespace}
      createAccessReview={accessReview}
      createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: ResourceLabel(RoleModel, t) })}
      createProps={{ to: `/k8s/cluster/roles/~new` }}
      flatten={resources => _.flatMap(resources, 'data').filter(r => !!r)}
      resources={[
        { kind: 'Role', namespaced: true, optional: mock },
        { kind: 'ClusterRole', namespaced: false, optional: true },
      ]}
      rowFilters={[
        {
          filterGroupName: t('COMMON:MSG_COMMON_FILTER_14'),
          type: 'role-kind',
          reducer: roleType,
          items: [
            { id: 'cluster', title: 'Cluster-wide Roles' },
            { id: 'namespace', title: 'Namespace Roles' },
            { id: 'system', title: 'System Roles' },
          ],
        },
      ]}
      title={t('COMMON:MSG_LNB_MENU_75')}
      isClusterScope
    />
  );
};
