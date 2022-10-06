import * as _ from 'lodash-es';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';
import * as PropTypes from 'prop-types';
import * as classNames from 'classnames';

import { history, SelectorInput, LoadingBox } from './../utils';
import { namespaceProptype } from '../../propTypes';
import { split, selectorFromString } from '../../module/k8s/selector';
import { requirementFromString } from '../../module/k8s/selector-requirement';
import { resourceListPages } from './../resource-pages';
import { ResourceListDropdown } from './../resource-dropdown';
import { connectToModel } from '../../kinds';
import { connectToFlags, flagPending } from '../../reducers/features';
import { FLAGS } from '@console/shared/src/constants';
import { referenceForModel, kindForReference } from '../../module/k8s';
import { AsyncComponent } from './../utils/async';
import { DefaultPage } from './../default-resource';

const ResourceList = connectToModel(({ kindObj, kindsInFlight, namespace, selector, fake }) => {
  if (kindsInFlight) {
    return <LoadingBox />;
  }

  const componentLoader = resourceListPages.get(referenceForModel(kindObj), () => Promise.resolve(DefaultPage));
  const ns = kindObj.namespaced ? namespace : undefined;

  return <AsyncComponent loader={componentLoader} namespace={ns} selector={selector} kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind} showTitle={false} autoFocus={false} fake={fake} />;
});

const updateUrlParams = (k, v) => {
  const url = new URL(window.location);
  const sp = new URLSearchParams(window.location.search);
  sp.set(k, v);
  history.push(`${url.pathname}?${sp.toString()}${url.hash}`);
};

const updateKind = kind => updateUrlParams('kind', encodeURIComponent(kind));
const updateTags = tags => updateUrlParams('q', tags.map(encodeURIComponent).join(','));

class GrafanaPage_ extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setRef = ref => (this.ref = ref);
    this.onSelectorChange = k => {
      updateKind(k);
      this.ref && this.ref.focus();
    };
  }

  render() {
    const { flags, location, namespace } = this.props;
    let kind, q;

    // if (flagPending(flags.OPENSHIFT) || flagPending(flags.PROJECTS_AVAILABLE)) {
    //   return null;
    // }

    if (location.search) {
      const sp = new URLSearchParams(window.location.search);
      kind = sp.get('kind');
      q = sp.get('q');
    }

    // Ensure that the "kind" route parameter is a valid resource kind ID
    kind = kind ? decodeURIComponent(kind) : 'Service';
    let ns = localStorage.getItem('bridge/last-namespace-name') === '#ALL_NS#' ? 'all-namespaces' : localStorage.getItem('bridge/last-namespace-name') ?? 'all-namespaces';
    // const showGettingStarted = flags.OPENSHIFT && !flags.PROJECTS_AVAILABLE;
    // let url = `${document.location.origin}/api/grafana/d/k8s-namespace/?var-namespace=${ns}`;
    let url = `${document.location.origin}/api/grafana/login/generic_oauth`;
    return (
      <React.Fragment>
        <div>
          <Helmet>
            <title>GRAFANA</title>
          </Helmet>
          {/* <NavTitle title="GRAFANA"></NavTitle> */}
          <iframe style={{ width: '100%', height: '100vh', border: 0 }} src={url} target="_blank" />
        </div>
      </React.Fragment>
    );
  }
}

export const GrafanaPage = connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROJECTS_AVAILABLE)(GrafanaPage_);

GrafanaPage.propTypes = {
  namespace: namespaceProptype,
  location: PropTypes.object.isRequired,
};
