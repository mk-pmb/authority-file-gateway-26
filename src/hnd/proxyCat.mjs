// -*- coding: utf-8, tab-width: 2 -*-

import axios from 'axios';
import httpErrors from '@ubhd-as22/http-server-base/src/httpErrors.mjs';
import loMapValues from 'lodash.mapvalues';

import learnCatalogFromCfgDict from './learnCatalogFromCfgDict.mjs';


const {
  badGateway,
  gatewayTimeout,
} = httpErrors.throwable;


function sTrim(s) { return String(s || '').trim(); }

const doNothing = Boolean;


(function warnProxyVars() {
  const vars = [
    'https_proxy',
  ].map(p => [p, p.toUpperCase()]).flat();
  const have = vars.filter(p => process.env[p]).join(', ');
  if (!have) { return; }
  const m = ('Found environment variable(s) [' + have
      + '] which will interfere with axios.');
  throw new Error(m);
}());


const EX = {
  routeName: 'proxycat',

  flavors: new Map(), /* To avoid cyclical dependency,
    we let proxycat modules register themselves here. */


  async learnCatalogTopLevel(learnCtx, mustPopCfgMeta) {
    const { state } = learnCtx;
    loMapValues({
      defaultUpstreamTimeoutSec: 'pos num',
    }, function copy(rule, key) { state[key] = mustPopCfgMeta(rule, key); });
  },


  async learnOneCfgKey(learnCtx, catName, mustPop) {
    const { state } = learnCtx;
    const flavorName = mustPop('nonEmpty str', 'flavor', catName);
    const flavorImpl = EX.flavors.get(flavorName);
    if (!flavorImpl) {
      const msg = ('Proxy catalog ' + catName
        + ' uses unsupported proxy flavor ' + flavorName);
      throw new Error(msg);
    }
    const catInfo = { catName, flavorName };
    state.knownCatalogs.set(catName, catInfo);
    const subCtx = { ...learnCtx, catInfo };

    let val = mustPop('pos num | undef | nul', 'upstreamTimeoutSec');
    val ||= state.defaultUpstreamTimeoutSec;
    const upstreamTimeoutMsec = (+val || 0) * 1e3;

    catInfo.axiosConfig = {
      timeout: upstreamTimeoutMsec,
    };

    flavorImpl.learnConfig(subCtx, mustPop);
    mustPop.expectEmpty();
    // subCtx.learnSubDict(mustPop, 'upstream', EX.learnUpstream);
  },


  async searchHndImpl(searchReqCtx) {
    const { catInfo } = searchReqCtx;
    const { flavorName } = catInfo;
    const flavorImpl = EX.flavors.get(flavorName);
    const reply = await flavorImpl.searchHndImpl(searchReqCtx);
    return reply;
  },


  async axiosRequest(catInfo, how) {
    const {
      onFailLogDetails,
      ...arq
    } = {
      method: 'GET',
      url: 'https://missing.url.invalid/',
      // data: // request body

      onFailLogDetails: doNothing,

      ...catInfo.axiosConfig,
      ...how,
    };
    try {
      const rspBody = await axios(arq);
      return rspBody;
    } catch (caught) {
      if (caught.name !== 'AxiosError') { throw caught; }
      let msg = sTrim(caught.message);
      if (caught.code) { msg = caught.code + (msg && ': ') + msg; }
      if (caught.response) {
        console.debug('Axios Error has response:',
          Object.keys(caught.response));
      }
      onFailLogDetails('ProxyCat axiosRequest failure:', msg,
        'while trying to', arq.method, arq.url);
      const err = (caught.response ? badGateway : gatewayTimeout)(msg);
      throw err;
    }
  },



};





EX.install = learnCatalogFromCfgDict.install.bind(null, EX);


export default EX;
