import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { ClusterTemplateModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { ResourceKebab, Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

const { common } = Kebab.factory;
const kind = ClusterTemplateModel.kind;

export const clusterTemplateMenuActions = [...Kebab.getExtensionsActionsForKind(ClusterTemplateModel), ...common];

const objectKinds = clustertemplate => {
  const objects = !!clustertemplate.objectKinds ? clustertemplate.objectKinds : [];
  let objMap = new Map();
  for (const i in objects) {
    const kind = !!objects[i] ? objects[i] : 'unknown kind';
    if (!!objMap.get(kind)) {
      const num = objMap.get(kind) as number;
      objMap.set(kind, num + 1);
    } else {
      objMap.set(kind, 1);
    }
  }
  const objectList = [];
  objMap.forEach((value, key) => {
    objectList.push(
      <div>
        {key} {value}
      </div>,
    );
  });

  return <div>{objectList}</div>;
};

const ClusterTemplateDetails: React.FC<ClusterTemplateDetailsProps> = ({ obj: clusterTemplate }) => {
  const { t } = useTranslation();
  const objectSummary = objectKinds(clusterTemplate);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: ResourceLabel(clusterTemplate, t) })} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={clusterTemplate}></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_104')}</dt>
              <dd>{objectSummary}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ClusterTemplateDetailsProps = {
  obj: K8sResourceKind;
};

const { details, editResource } = navFactory;
const ClusterTemplatesDetailsPage: React.FC<ClusterTemplatesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={clusterTemplateMenuActions} pages={[details(ClusterTemplateDetails), editResource()]} />;
ClusterTemplatesDetailsPage.displayName = 'ClusterTemplatesDetailsPage';

const tableColumnClasses = [
  '', // NAME
  '', // RESOURCE SUMMARY
  '', // CREATED
  Kebab.columnClass, // MENU ACTIONS
];

const ClusterTemplateTableRow = ({ obj, index, key, style }) => {
  const objects = objectKinds(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} title={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{objects}</TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={clusterTemplateMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ClusterTemplateTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_104'),
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};

ClusterTemplateTableHeader.displayName = 'ClusterTemplateTableHeader';

const ClusterTemplatesList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Cluster Template" Header={ClusterTemplateTableHeader.bind(null, t)} Row={ClusterTemplateTableRow} />;
};
ClusterTemplatesList.displayName = 'ClusterTemplatesList';

const ClusterTemplatesPage: React.FC<ClusterTemplatesPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_104')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_104') })} canCreate={true} kind={kind} ListComponent={ClusterTemplatesList} {...props} />;
};
ClusterTemplatesPage.displayName = 'ClusterTemplatesPage';

export { ClusterTemplatesList, ClusterTemplatesPage, ClusterTemplatesDetailsPage };

type ClusterTemplatesPageProps = {};

type ClusterTemplatesDetailsPageProps = {
  match: any;
};
