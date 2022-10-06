// 개발자 - 헬름 - 헬름 릴리스 에서 보여주는 화면 내용이 담긴 파일입니다.
import * as React from 'react';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router';
import { useTranslation } from 'react-i18next';
import { HelmReleaseStatusReducer } from '@console/dev-console/src/utils/hc-status-reducers';
import { SectionHeading, Timestamp, ResourceLink, Kebab, KebabOption, detailsPage, navFactory, KebabAction } from '@console/internal/components/utils';
import { ResourceLabel } from '@console/internal/models/hypercloud/resource-plural';
import { modelFor } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { deleteModal } from '../modals';
import { TableProps } from './utils/default-list-component';
import { DetailsPage, ListPage, DetailsPageProps } from '../factory';
import { resourceSortFunction } from './utils/resource-sort';
import { HelmChartModel, HelmReleaseModel } from '@console/internal/models/hypercloud/helm-model';
import { CreateHelmRelease } from '../hypercloud/form/helmreleases/create-helmrelease';
import { getHelmHost } from '@console/internal/actions/utils/nonk8s-utils';

const kind = HelmReleaseModel.kind;

const capitalize = (text: string) => {
  return typeof text === 'string' ? text.charAt(0).toUpperCase() + text.slice(1) : text;
};
export interface HelmReleasePageProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
}
const filters = t => [
  {
    filterGroupName: t('COMMON:MSG_COMMON_FILTER_10'),
    type: 'helmRelease-status',
    reducer: HelmReleaseStatusReducer,
    items: [
      { id: 'unknown', title: 'Unknown' },
      { id: 'deployed', title: 'Deployed' },
      { id: 'failed', title: 'Failed' },
      { id: 'pending', title: 'Pending' },
    ],
  },
];

export const HelmReleasePage: React.FC<HelmReleasePageProps> = props => {
  const { t } = useTranslation();
  const { match } = props;
  const namespace = match.params.ns;
  return <ListPage {...props} canCreate={true} tableProps={tableProps} kind={kind} rowFilters={filters.bind(null, t)()} createProps={{ to: `/helmreleases/ns/${namespace}/~new`, items: [] }} hideLabelFilter={true} customData={{ nonK8sResource: true, kindObj: HelmReleaseModel }} isK8sResource={false} />;
};

const ResourceKind: React.FC<ResourceKindProps> = ({ kind }) => {
  const { t } = useTranslation();
  return <p>{modelFor(kind) ? ResourceLabel(modelFor(kind), t) : kind}</p>;
};
type ResourceKindProps = {
  kind: string;
};

const tableProps: TableProps = {
  header: [
    {
      title: 'COMMON:MSG_MAIN_TABLEHEADER_1',
      sortField: 'name',
    },
    {
      title: 'COMMON:MSG_MAIN_TABLEHEADER_2',
      sortField: 'namespace',
    },
    {
      title: 'COMMON:MSG_MAIN_TABLEHEADER_112',
      sortFunc: 'HelmReleaseStatusReducer',
    },
    {
      title: 'COMMON:MSG_MAIN_TABLEHEADER_110',
      sortFunc: 'helmResourcesNumber',
    },
    {
      title: 'COMMON:MSG_MAIN_TABLEHEADER_132',
      sortField: 'version',
    },
    {
      title: 'COMMON:MSG_MAIN_TABLEHEADER_12',
      sortField: 'info.first_deployed',
    },
    {
      title: '',
      transforms: null,
      props: { className: Kebab.columnClass },
    },
  ],
  row: (obj: any) => {
    const options: KebabOption[] = [
      {
        label: 'COMMON:MSG_MAIN_ACTIONBUTTON_15**COMMON:MSG_LNB_MENU_203',
        href: `/helmreleases/ns/${obj.namespace}/${obj.name}/edit`,
      },
      {
        label: 'COMMON:MSG_MAIN_ACTIONBUTTON_16**COMMON:MSG_LNB_MENU_203',
        callback: async () => {
          const host = await getHelmHost();
          deleteModal({
            nonk8sProps: {
              deleteServiceURL: `${host}/helm/v1/namespaces/${obj.namespace}/releases/${obj.name}`,
              stringKey: 'COMMON:MSG_LNB_MENU_203',
              namespace: obj.namespace,
              name: obj.name,
            },
          });
        },
      },
    ];
    return [
      {
        children: <ResourceLink manualPath={`/helmreleases/ns/${obj.namespace}/${obj.name}`} kind={HelmReleaseModel.kind} name={obj.name} />,
      },
      {
        className: 'co-break-word',
        children: <ResourceLink kind="Namespace" name={obj.namespace} title={obj.namespace} />,
      },
      {
        children: <Status status={capitalize(HelmReleaseStatusReducer(obj))} />,
      },
      {
        children:
          obj.objects &&
          Object.keys(obj.objects)
            .sort((a, b) => {
              return resourceSortFunction(a) - resourceSortFunction(b);
            })
            .map(k => {
              return <ResourceKind key={'resource-' + k} kind={k} />;
            }),
      },
      {
        children: obj.version,
      },
      {
        children: obj.info?.first_deployed && <Timestamp timestamp={obj.info?.first_deployed} />,
      },
      {
        className: Kebab.columnClass,
        children: <Kebab options={options} />,
      },
    ];
  },
};

const { details } = navFactory;
export const HelmReleaseDetailsPage: React.FC<DetailsPageProps> = props => {
  const { t } = useTranslation();
  const name = props.match?.params?.name;
  const menuActions: KebabAction[] = [
    () => ({
      label: 'COMMON:MSG_MAIN_ACTIONBUTTON_15**COMMON:MSG_LNB_MENU_203',
      href: `/helmreleases/ns/${props.namespace}/${name}/edit`,
    }),
    () => ({
      label: 'COMMON:MSG_MAIN_ACTIONBUTTON_16**COMMON:MSG_LNB_MENU_203',
      callback: async () => {
        const host = await getHelmHost();
        deleteModal({
          nonk8sProps: {
            deleteServiceURL: `${host}/helm/v1/namespaces/${props.namespace}/releases/${name}`,
            stringKey: 'COMMON:MSG_LNB_MENU_203',
            namespace: props.namespace,
            name: name,
            listPath: `/helmreleases/ns/${props.namespace}`,
          },
        });
      },
    }),
  ];
  const capitalizeHelmReleaseStatusReducer = release => {
    return capitalize(HelmReleaseStatusReducer(release));
  };
  return (
    <DetailsPage
      {...props}
      kind={kind}
      pages={[
        details(detailsPage(HelmReleaseDetails)),
        {
          name: 'COMMON:MSG_DETAILS_TAB_18',
          href: 'edit',
          component: CreateHelmRelease,
        },
      ]}
      name={props.match?.params?.name}
      menuActions={menuActions}
      getResourceStatus={capitalizeHelmReleaseStatusReducer}
      customData={{ nonK8sResource: true, kindObj: HelmReleaseModel }}
      isK8sResource={false}
      breadcrumbsFor={() => {
        return [
          { name: t(HelmReleaseModel.i18nInfo.labelPlural), path: props.namespace ? `/helmreleases/ns/${props.namespace}` : '/helmreleases/all-namespaces' },
          { name: t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t(HelmReleaseModel.i18nInfo.label) }), path: '' },
        ];
      }}
    />
  );
};
const HelmReleaseDetails: React.FC<HelmReleaseDetailsProps> = ({ obj: release }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t(HelmReleaseModel.i18nInfo.label) })} />
      <div className="row">
        <div className="col-lg-6">
          <dl data-test-id="resource-summary" className="co-m-pane__details">
            <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_5')}</dt>
            <dd>{release.name}</dd>
            <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_6')}</dt>
            <dd>
              <ResourceLink kind="Namespace" name={release.namespace} />
            </dd>
            <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_43')}</dt>
            <dd>
              <Timestamp timestamp={release.info?.first_deployed} />
            </dd>
          </dl>
        </div>
        <div className="col-lg-6">
          <HelmReleaseDetailsList release={release} />
        </div>
      </div>
      <div className="row">
        <div style={{ paddingTop: '30px' }}>
          <h1>{t('COMMON:MSG_MAIN_TABLEHEADER_110')}</h1>
          <table className="pf-c-table">
            <thead>
              <tr>
                <th style={{ padding: '5px' }}>{t('SINGLE:MSG_HELMRELEASES_HELMRELEASEDETAILS_TABDETAILS_4')}</th>
                <th style={{ padding: '5px' }}>{t('SINGLE:MSG_HELMRELEASES_HELMRELEASEDETAILS_TABDETAILS_5')}</th>
              </tr>
            </thead>
            <tbody>
              {release.objects &&
                Object.keys(release.objects)
                  .sort((a, b) => {
                    return resourceSortFunction(a) - resourceSortFunction(b);
                  })
                  .map(k => {
                    return (
                      <tr key={'row-' + k}>
                        <td style={{ padding: '5px' }}>{modelFor(k) ? ResourceLabel(modelFor(k), t) : k}</td>
                        <td style={{ padding: '5px' }}>
                          {release.objects[k].map(object => {
                            return <ResourceLink key={`resource-link-key-${k}`} kind={k} name={object} namespace={release.namespace} />;
                          })}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
type HelmReleaseDetailsProps = {
  obj: any;
};

export const HelmReleaseDetailsList: React.FC<HelmReleaseDetailsListProps> = ({ release }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_45')}</dt>
      <dd>
        <Status status={capitalize(HelmReleaseStatusReducer(release))} />
      </dd>
      <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_10')}</dt>
      <dd>{release.chart?.metadata?.description}</dd>
      <dt>{t('SINGLE:MSG_HELMRELEASES_HELMRELEASEDETAILS_TABDETAILS_1')}</dt>
      <dd>{release.chart?.metadata?.repo ? <ResourceLink manualPath={`/helmcharts/${release.chart?.metadata?.repo}/${release.chart?.metadata?.name}`} kind={HelmChartModel.kind} name={release.chart?.metadata?.name} /> : release.chart?.metadata?.name}</dd>
      <dt>{t('SINGLE:MSG_HELMRELEASES_HELMRELEASEDETAILS_TABDETAILS_2')}</dt>
      <dd>{release.version}</dd>
    </dl>
  );
};
type HelmReleaseDetailsListProps = {
  release: any;
};

export default HelmReleasePage;
