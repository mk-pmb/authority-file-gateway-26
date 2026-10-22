// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import loMapValues from 'lodash.mapvalues';
import mustBe from 'typechecks-pmb/must-be.js';

import learnCatalogFromCfgDict from './learnCatalogFromCfgDict.mjs';


const { fetch } = globalThis;

function sTrim(s) { return String(s || '').trim(); }


const EX = {
  routeName: 'proxycat',


  async learnOneCfgKey(learnCtx, catName, mustPop) {
    const catInfo = { catName };
    learnCtx.state.knownCatalogs.set(catName, catInfo);
    const subCtx = { ...learnCtx, catInfo };
    subCtx.learnSubDict(mustPop, 'upstream', EX.learnUpstream);
  },


  learnUpstream(learnCtx, mustPop) {
    const { catInfo } = learnCtx;

    let urlTemplate = mustPop('nonEmpty str | ary', 'urlTemplate');
    if (Array.isArray(urlTemplate)) { urlTemplate = urlTemplate.join(''); }
    mustBe.nest('Assembled urlTemplate', urlTemplate);

    catInfo.upstream = {
      entryKeysMap: mustPop('dictObj | eeq:false', 'entryKeysMap'),
      method: mustPop('nonEmpty str', 'method'),
      urlTemplate,
    };
  },


  async searchHndImpl(searchReqCtx) {
    const { catId, catInfo, qryParsed, req } = searchReqCtx;
    const { upstream } = catInfo;
    const url = upstream.urlTemplate.replace(/%Q(\w)/g,
      (m, k) => m && encodeURIComponent(getOwn(qryParsed, k, '')));
    req.logCkp(catId, 'Upstream URL:', url);

    let data;
    try {
      data = await fetch(url);
      data = await data.json();
    } catch (caught) {
      req.logCkp(catId, 'Fetch failed:', caught);
      throw caught;
    }

    const entKeysMap = upstream.entryKeysMap;
    if (entKeysMap) {
      data = data.map(e => loMapValues(entKeysMap, k => sTrim(getOwn(e, k))));
    }

    const replyMeta = {
      'dc:source': url,
    };
    const replyList = [replyMeta].concat(data);
    return replyList;
  },


};





EX.install = learnCatalogFromCfgDict.install.bind(null, EX);


export default EX;
