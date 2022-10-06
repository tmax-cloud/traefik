import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import { k8sPatch } from '../../module/k8s';
import { RoleModel, ClusterRoleModel } from '../../models';
import { Kebab, EmptyBox, ResourceIcon } from '../utils';
import { confirmModal } from '../modals';
import { useTranslation } from 'react-i18next';

export const RulesList = ({ rules, name, namespace }) => {
  const { t } = useTranslation();
  return _.isEmpty(rules) ? (
    <EmptyBox label={t('COMMON:MSG_LNB_MENU_75')} />
  ) : (
    <div className="co-m-table-grid co-m-table-grid--bordered rbac-rules-list">
      <div className="row co-m-table-grid__head">
        <div className="col-xs-5 col-sm-4 col-md-3 col-lg-2">{t('COMMON:MSG_DETAILS_TABDETAILS_RULES_TABLEHEADER_1')}</div>
        <div className="hidden-xs col-sm-4 col-md-3 col-lg-3">{t('COMMON:MSG_DETAILS_TABDETAILS_RULES_TABLEHEADER_2')}</div>
        <div className="col-xs-7 col-sm-4 col-md-6 col-lg-7">{t('COMMON:MSG_DETAILS_TABDETAILS_RULES_TABLEHEADER_3')}</div>
      </div>
      <div className="co-m-table-grid__body">
        {rules.map((rule, i) => (
          <div className="row co-resource-list__item" key={i}>
            <Rule {...rule} name={name} namespace={namespace} i={i} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Actions = ({ verbs }) => {
  let actions = [];
  _.each(verbs, a => {
    if (a === '*') {
      actions = <div className="rbac-rule-row">All</div>;
      return false;
    }
    actions.push(
      <div className="rbac-rule-row" key={a}>
        {a}
      </div>,
    );
  });
  return <div>{actions}</div>;
};

const Groups = ({ apiGroups }) => {
  // defaults to [""]
  let groups = [];
  _.each(apiGroups, g => {
    if (g === '*') {
      groups = (
        <div className="rbac-rule-row">
          * <i>All</i>
        </div>
      );
      return false;
    }
    groups.push(
      <div className="rbac-rule-row" key={g}>
        {g}
      </div>,
    );
  });
  return <div>{groups}</div>;
};

const Resources = connect(({ k8s }) => ({ allModels: k8s.getIn(['RESOURCES', 'models']) }))(({ resources, nonResourceURLs, allModels }) => {
  let allResources = [];
  resources &&
    _.each([...new Set(resources)].sort(), r => {
      if (r === '') {
        return false;
      }
      if (r === '*') {
        allResources = [
          <span key={r} className="rbac-rule-resource rbac-rule-row">
            All Resources
          </span>,
        ];
        return false;
      }
      const base = r.split('/')[0];
      const kind = allModels.find(model => model.plural === base);

      allResources.push(
        <span key={r} className="rbac-rule-resource rbac-rule-row">
          <ResourceIcon kind={kind ? kind.kind : r} /> <span className="rbac-rule-resource__label">{r}</span>
        </span>,
      );
    });

  if (nonResourceURLs && nonResourceURLs.length) {
    if (allResources.length) {
      allResources.push(<hr key="hr" className="resource-separator" />);
    }
    let URLs = [];
    _.each(nonResourceURLs.sort(), r => {
      if (r === '*') {
        URLs = [
          <div className="rbac-rule-row" key={r}>
            All Non-resource URLs
          </div>,
        ];
        return false;
      }
      URLs.push(
        <div className="rbac-rule-row" key={r} style={{marginRight: '10px'}}>
          <ResourceIcon kind="URL" />
          {r}
        </div>,
      );
    });
    allResources.push.apply(allResources, URLs);
  }
  return <div className="rbac-rule-resources">{allResources}</div>;
});

const DeleteRule = (name, namespace, i) => {
  const { t } = useTranslation();
  return {
    label: t('COMMON:MSG_COMMON_ACTIONBUTTON_65'),
    callback: () =>
      confirmModal({
        title: t('COMMON:MSG_COMMON_ACTIONBUTTON_65'),
        message: t('SINGLE:MSG_ROLES_ROLEDETAILS_TABDETAILS_RULES_2', { 0: `#${i}` }),
        btnText: t('COMMON:MSG_COMMON_ACTIONBUTTON_65'),
        cancelText: t('COMMON:MSG_COMMON_BUTTON_COMMIT_2'),
        executeFn: () => {
          const kind = namespace ? RoleModel : ClusterRoleModel;
          return k8sPatch(kind, { metadata: { name, namespace } }, [
            {
              op: 'remove',
              path: `/rules/${i}`,
            },
          ]);
        },
      }),
  };
};

// This page is temporarily disabled until we update the safe resources list.
// const EditRule = (name, namespace, i) => ({
//   label: 'Edit Rule',
//   href: namespace ? `/k8s/ns/${namespace}/roles/${name}/${i}/edit` : `/k8s/cluster/clusterroles/${name}/${i}/edit`,
// });

const RuleKebab = ({ name, namespace, i }) => {
  const options = [
    // EditRule,
    DeleteRule,
  ].map(f => f(name, namespace, i));
  return <Kebab options={options} />;
};

const Rule = ({ resources, nonResourceURLs, verbs, apiGroups, name, namespace, i }) => (
  <div className="rbac-rule">
    <div className="col-xs-5 col-sm-4 col-md-3 col-lg-2">
      <Actions verbs={verbs} />
    </div>
    <div className="hidden-xs col-sm-4 col-md-3 col-lg-3">
      <Groups apiGroups={apiGroups} />
    </div>
    <div className="col-xs-7 col-sm-4 col-md-6 col-lg-7">
      <Resources resources={resources} nonResourceURLs={nonResourceURLs} />
    </div>
    <div className="dropdown-kebab-pf">
      <RuleKebab name={name} namespace={namespace} i={i} />
    </div>
  </div>
);
