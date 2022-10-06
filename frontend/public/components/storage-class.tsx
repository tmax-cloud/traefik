import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  DetailsItem,
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  detailsPage,
  navFactory,
} from './utils';
import { StorageClassResourceKind, K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { StorageClassModel } from '../models';
import { ResourceLabel } from '../models/hypercloud/resource-plural';

export const StorageClassReference: K8sResourceKindReference = 'StorageClass';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(StorageClassModel), ...common];

const defaultClassAnnotation = 'storageclass.kubernetes.io/is-default-class';
const betaDefaultStorageClassAnnotation = 'storageclass.beta.kubernetes.io/is-default-class';
export const isDefaultClass = (storageClass: K8sResourceKind) => {
  const annotations = _.get(storageClass, 'metadata.annotations') || {};
  return (
    annotations[defaultClassAnnotation] === 'true' ||
    annotations[betaDefaultStorageClassAnnotation] === 'true'
  );
};

const tableColumnClasses = [
  classNames('col-sm-5', 'col-xs-6'),
  classNames('col-sm-5', 'col-xs-6'),
  classNames('col-sm-2', 'hidden-xs'),
  Kebab.columnClass,
];

const StorageClassTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_30'),
      sortField: 'provisioner',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_31'),
      sortField: 'reclaimPolicy',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
StorageClassTableHeader.displayName = 'StorageClassTableHeader';

const StorageClassTableRow: RowFunction<StorageClassResourceKind> = ({
  obj,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink kind={StorageClassReference} name={obj.metadata.name}>
          {isDefaultClass(obj) && (
            <span className="small text-muted co-resource-item__help-text">&ndash; Default</span>
          )}
        </ResourceLink>
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {obj.provisioner}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{obj.reclaimPolicy || '-'}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={StorageClassReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const StorageClassDetails: React.SFC<StorageClassDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return <>
    <div className="co-m-pane__body">
      <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', {0: ResourceLabel(obj, t)})} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj}>
            <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_50')} obj={obj} path="provisioner" />
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <DetailsItem label={`${t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_51')}`} obj={obj} path="reclaimPolicy" />
            <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_52')}</dt>
            <dd>{isDefaultClass(obj).toString()}</dd>
            <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_53')} obj={obj} path="volumeBindingMode" />
          </dl>
        </div>
      </div>
    </div>
  </>;
};

export const StorageClassList: React.SFC = (props) => {
  const { t } = useTranslation();
  return <Table
    {...props}
    aria-label="Storage Classes"
    Header={StorageClassTableHeader.bind(null, t)}
    Row={StorageClassTableRow}
    virtualize
  />;
};

StorageClassList.displayName = 'StorageClassList';

export const StorageClassPage: React.SFC<StorageClassPageProps> = (props) => {
  const { t } = useTranslation();

  return (
    <ListPage
      {..._.omit(props, 'mock')}
      title={t('COMMON:MSG_LNB_MENU_53')}
      createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_53') })}
      kind={StorageClassReference}
      ListComponent={StorageClassList}
      canCreate={true}
      filterLabel={props.filterLabel}
    />
  );
};

const pages = [navFactory.details(detailsPage(StorageClassDetails)), navFactory.editResource()];

export const StorageClassDetailsPage: React.SFC<StorageClassDetailsPageProps> = (props) => {
  return (
    <DetailsPage {...props} kind={StorageClassReference} menuActions={menuActions} pages={pages} />
  );
};
StorageClassDetailsPage.displayName = 'StorageClassDetailsPage';

export type StorageClassDetailsProps = {
  obj: any;
};

export type StorageClassPageProps = {
  filterLabel: string;
  namespace: string;
};

export type StorageClassDetailsPageProps = {
  match: any;
};
