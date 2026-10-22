// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';

import learnCatalogFromCfgDict from './learnCatalogFromCfgDict.mjs';


const { fetch } = globalThis;

// function sTrim(s) { return String(s || '').trim(); }


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

    /*
    const entKeysMap = upstream.entryKeysMap;
    if (entKeysMap) {
      data = data.map(e => loMapValues(entKeysMap, k => sTrim(getOwn(e, k))));
    }
    */
    if (Array.isArray(data)) {
      data = data.map(function dirtyHackForLobidGND(orig) {
        const [title, firstHintSep, ...hints] = String(orig?.label
          || '').split(/(\s+\|\s+)/);
        const item = { 'dc:identifier': orig.id, 'dc:title': title };
        if (firstHintSep) { item['dc:description'] = hints.join(''); }
        return item;
      });
    } else {
      data = {
        'dc:identifier': '',
        'dc:title': 'Lobid API Error',
        'dc:description': JSON.stringify(data, null, 2).replace(/\n\s*/g, ' '),
      };
    }

    const replyMeta = {
      // sources: [url],
      nFound: null,
      nSkipped: 0,
      nTotalCatalogItems: null,
    };
    const replyList = [replyMeta].concat(data);
    return replyList;
  },


};





EX.install = learnCatalogFromCfgDict.install.bind(null, EX);


export default EX;
