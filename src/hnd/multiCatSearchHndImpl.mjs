// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import httpErrors from '@ubhd-as22/http-server-base/src/httpErrors.mjs';


const {
  badBodyData,
} = httpErrors.throwable;


function mergeQueryDefaults(q, d) { return (d ? { ...d, ...q } : q); }
function sTrim(s) { return String(s || '').trim(); }


const EX = async function searchHnd(impl, state, req) {
  req.confirmCors();
  let qryMerged = {
    ...state?.commonMeta?.queryDefaults,
    ...req.query,
  };
  if (req.method === 'POST') {
    const bodyData = await req.parseRequestBody({ fmt: 'webform' });
    Object.assign(qryMerged, bodyData);
  }

  function qryNonEmptyStr(key, descr) {
    const val = sTrim(getOwn(qryMerged, key));
    if (val) { return val; }
    throw badBodyData('Empty ' + descr + ' (field ' + key + ')');
  }

  const catId = qryNonEmptyStr('c', 'catalog ID');
  const catInfo = state.knownCatalogs.get(catId);
  if (!catInfo) { throw badBodyData('Unknown catalog ID'); }
  qryMerged = mergeQueryDefaults(qryMerged, catInfo.queryDefaults);

  function qryIntPosOr0(key) {
    const val = +getOwn(qryMerged, key);
    return ((Number.isInteger(val) && (val >= 1) && val) || 0);
  }

  const qryParsed = {
    c: catId,
    s: qryNonEmptyStr('s', 'Search string'),
    o: qryIntPosOr0('o'),
    n: qryIntPosOr0('n'),
  };
  const searchReqCtx = {
    catId,
    catInfo,
    qryIntPosOr0,
    qryMerged,
    qryNonEmptyStr,
    qryParsed,
    req,
  };

  const rspData = await impl(searchReqCtx);
  req.sendJsonResult(rspData);
};


// Object.assign(EX, {});
export default EX;
