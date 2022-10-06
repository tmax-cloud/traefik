import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import ActivityBody, { RecentEventsBody } from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
// import ActivityBody, { RecentEventsBody, OngoingActivityBody } from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { EventModel, NodeModel } from '@console/internal/models';
import { EventKind, NodeKind } from '@console/internal/module/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { NodeDashboardContext } from './NodeDashboardContext';
import { useTranslation } from 'react-i18next';

const eventsResource = {
  isList: true,
  kind: EventModel.kind,
};

const nodeEventsFilter = (event: EventKind, kind: string, name: string): boolean => {
  const { kind: objectKind, name: objectName } = event?.involvedObject || {};
  return objectKind === kind && objectName === name;
};

const RecentEvent: React.FC<RecentEventProps> = ({ node }) => {
  const [data, loaded, loadError] = useK8sWatchResource<EventKind[]>(eventsResource);
  const { name } = node.metadata;
  const eventsFilter = React.useCallback(event => nodeEventsFilter(event, NodeModel.kind, name), [name]);
  return <RecentEventsBody events={{ data, loaded, loadError }} filter={eventsFilter} />;
};

const ActivityCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const eventsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/events`;
  const { t } = useTranslation();
  return (
    <DashboardCard gradient data-test-id="activity-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('SINGLE:MSG_OVERVIEW_MAIN_CARDACTIVITY_TITLE_1')}</DashboardCardTitle>
        <DashboardCardLink to={eventsLink}>{t('SINGLE:MSG_OVERVIEW_MAIN_CARDACTIVITY_ALL_1')}</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ActivityBody className="co-project-dashboard__activity-body">
          {/* <OngoingActivityBody loaded /> */}
          <RecentEvent node={obj} />
        </ActivityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type RecentEventProps = {
  node: NodeKind;
};

export default ActivityCard;
