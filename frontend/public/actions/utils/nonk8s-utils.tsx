import * as _ from 'lodash-es';
import { CustomMenusMap } from '@console/internal/hypercloud/menu/menu-types';
import { getIngressUrl } from '@console/internal/components/hypercloud/utils/ingress-utils';
import { coFetchJSON } from '../../co-fetch';
import { history } from '@console/internal/components/utils/router';

export const getHelmHost = async () => {
  const mapUrl = (CustomMenusMap as any).Helm.url;
  return mapUrl !== '' ? mapUrl : await getIngressUrl('helm-apiserver');
};

export const helmAPI = '/api/kubernetes/apis/helmapi.tmax.io/v1';

export const getKind = (id: string) => {
  return id.split('~~')[0];
};
const getHelmRepo = (id: string) => {
  return id.split('~~')[1];
};

//get object api url 반환
export const nonK8sObjectUrl = async (id: string, namespace: string, name: string) => {
  const kind = getKind(id);
  let host = '';

  switch (kind) {
    case 'HelmRepository':
      return `${helmAPI}/repos/${name}`;
    case 'HelmRelease':
      host = await getHelmHost();
      return `${host}/helm/v1/namespaces/${namespace}/releases/${name}`;
    case 'HelmChart':
      host = await getHelmHost();
      const helmRepo = getHelmRepo(id);
      return `${host}/helm/v1/charts/${helmRepo}_${name}`;
    default:
      return '';
  }
};

//get object 결과 정리
export const nonK8sObjectResult = (kind: string, response: any) => {
  switch (kind) {
    case 'HelmRepository':
      return response.repoInfo[0];
    case 'HelmRelease':
      return response.release[0];
    case 'HelmChart':
      let entriesvalues = Object.values(_.get(response, 'indexfile.entries'));
      return entriesvalues[0][0];
    default:
      return {};
  }
};

//get list api url 반환
export const nonK8sListUrl = async (id: string, query: any) => {
  const kind = getKind(id);
  let host = '';

  switch (kind) {
    case 'HelmRepository':
      return `${helmAPI}/repos`;
    case 'HelmRelease':
      host = await getHelmHost();
      return query?.ns ? `${host}/helm/v1/namespaces/${query.ns}/releases` : `${host}/helm/v1/releases`;
    case 'HelmChart':
      host = await getHelmHost();
      const helmRepo = getHelmRepo(id);
      return helmRepo ? `${host}/helm/v1/charts?repository=${helmRepo}` : `${host}/helm/v1/charts`;
    default:
      return '';
  }
};
//get list 결과 정리
export const nonK8sListResult = async (id: string, response: any) => {
  const kind = getKind(id);
  switch (kind) {
    case 'HelmRepository':
      if (response.error) {
        return [];
      }
      await (async () => {
        await Promise.all(
          response.repoInfo.map(async repoinfo => {
            const helmHost = await getHelmHost();
            if (helmHost === null) {
              history.push('/ingress-check?ingresslabelvalue=helm-apiserver');
            }
            const response = await coFetchJSON(`${helmHost}/helm/v1/charts?repository=${repoinfo.name}`);
            let tempList = [];
            let entriesvalues = Object.values(_.get(response, 'indexfile.entries'));
            entriesvalues.map(value => {
              tempList.push(value[0]);
            });
            repoinfo.charts = tempList;
          }),
        );
      })();
      return response.repoInfo;
    case 'HelmRelease':
      if (response.error) {
        return [];
      }
      return response.release;
    case 'HelmChart':
      if (response.error) {
        return [];
      }
      let tempList = [];
      let entriesvalues = Object.values(_.get(response, 'indexfile.entries'));
      entriesvalues.map(value => {
        tempList.push(value[0]);
      });
      return tempList;
    default:
      return [];
  }
};
