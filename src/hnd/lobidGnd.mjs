// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import loMapValues from 'lodash.mapvalues';


import proxyCat from './proxyCat.mjs';


const EX = {

  async learnConfig(learnCtx, popGndSpec) {
    const { catInfo } = learnCtx;
    loMapValues({
      apiUrl: 'nonEmpty str',
      previewDetailsFields: 'ary',
      subject: 'nonEmpty dictObj',
    }, function copy(rule, key) { catInfo[key] = popGndSpec(rule, key); });

    const val = catInfo.previewDetailsFields.join(',');
    catInfo.commaGluedPreviewDetailsFields = (val && ',') + val;
  },


  async searchHndImpl(searchReqCtx) {
    const { catInfo, logCkp, qryParsed } = searchReqCtx;
    const suggUrl = (catInfo.apiUrl
      + '?q=' + encodeURIComponent(qryParsed.s)
      + '&from=' + encodeURIComponent(qryParsed.o)
      + '&size=' + encodeURIComponent(qryParsed.n)
      + getOwn(EX.suggestionsSortParam, qryParsed.r, '')
      + '&format=json:preferredName' + catInfo.commaGluedPreviewDetailsFields);

    const resp = await proxyCat.axiosRequest(catInfo, {
      method: 'GET',
      url: suggUrl,
      responseType: 'json',
      onFailLogDetails: logCkp,
    });
    logCkp('resp keys:', Object.keys(resp).sort().join(' '));
    let { data } = resp;

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
      nSkipped: 0,
      nFound: null,
      nTotalCatalogItems: null,
      upstreamRequestDurationSec: resp.duration / 1e3,
      // subject: catInfo.subject,
    };
    const replyList = [replyMeta].concat(data);
    return replyList;
  },


  suggestionsSortParam: {
    az: '&sort=preferredName.keyword:asc',
    za: '&sort=preferredName.keyword:desc',
  },



};




proxyCat.flavors.set('lobid-gnd', EX);

export default EX;
