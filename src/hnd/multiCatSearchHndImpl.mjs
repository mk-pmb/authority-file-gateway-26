// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '@ubhd-as22/http-server-base/src/httpErrors.mjs';

import commonGetPostApi from './commonGetPostApi.mjs';


const {
  badBodyData,
} = httpErrors.throwable;


const EX = async function searchHnd(impl, state, req) {
  const searchReqCtx = await commonGetPostApi.init(req);
  const catId = searchReqCtx.qryNonEmptyStr('c', 'catalog ID');
  const catInfo = state.knownCatalogs.get(catId);
  if (!catInfo) { throw badBodyData('Unknown catalog ID'); }
  Object.assign(searchReqCtx, {
    catId,
    catInfo,
    logCkp: req.logCkp.bind(req, catId),
  });
  searchReqCtx.qry = {
    ...commonGetPostApi.globalQueryDefaults,
    ...state?.commonMeta?.queryDefaults,
    ...catInfo.queryDefaults,
    ...searchReqCtx.qry,
  };
  searchReqCtx.qryParsed = {
    c: catId,
    s: searchReqCtx.qryNonEmptyStr('s', 'Search string'),
    o: searchReqCtx.qryIntPosOr0('o', 'Number of items to omit'),
    n: searchReqCtx.qryIntPosOr0('n', 'Results list limit'),
    r: searchReqCtx.qryTrimStr('r', 'Ranking rule name'),
  };

  const rspData = await impl(searchReqCtx);
  req.sendJsonResult(rspData);
};


// Object.assign(EX, {});
export default EX;
