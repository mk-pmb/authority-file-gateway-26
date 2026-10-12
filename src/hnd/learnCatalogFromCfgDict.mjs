// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import vTry from 'vtry';

import httpErrors from '@ubhd-as22/http-server-base/src/httpErrors.mjs';
import learnTopicDict from
  '@ubhd-as22/http-server-base/src/cfg/learnTopicDict.mjs';


const {
  badBodyData,
} = httpErrors.throwable;


function mergeQueryDefaults(q, d) { return (d ? { ...d, ...q } : q); }
function sTrim(s) { return String(s || '').trim(); }


const doNothing = Boolean;


const EX = {

  async init(catImpl, srv) {
    const rtName = mustBe.nest('routeName', catImpl.routeName);
    const had = (catImpl.state || doNothing)();
    if (had) { return had; }
    // Set dummy to help detect accidental recursion:
    catImpl.state = '…init…'; // eslint-disable-line no-param-reassign

    const state = (catImpl.initialState || {});
    delete catImpl.initialState; // eslint-disable-line no-param-reassign
    state.commonMeta ||= {};
    state.knownCatalogs ||= new Map();
    const learnCtx = {
      catImpl,
      ...EX.learnCtxExtras,
      srv,
      state,
    };
    await learnTopicDict(learnCtx, rtName, catImpl);
    await (catImpl.whenConfigured || doNothing)(learnCtx);

    // eslint-disable-next-line no-param-reassign
    catImpl.state = Object.bind(null, state);
    return state;
  },


  async install(catImpl, srv) {
    const state = await EX.init(catImpl, srv);
    const impl = catImpl.searchHndImpl;
    mustBe.fun('searchHndImpl for ' + catImpl.routeName, impl);
    return EX.searchHnd.bind(null, impl, state);
  },


  async searchHnd(impl, state, req) {
    req.confirmCors();
    let qryMerged = {
      ...state.commonMeta.queryDefaults,
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
  },




};


EX.learnCtxExtras = {

  learnMeta(learnCtx, mustPopCfgMeta) {
    const { state } = learnCtx;
    state.commonMeta.queryDefaults = mustPopCfgMeta('dictObj | nul | undef',
      'queryDefaults') || false;
    (learnCtx.catImpl.learnCatalogTopLevel
      || doNothing)(learnCtx, mustPopCfgMeta);
  },


  learnSubDict(popParentDict, subKey, learnImpl) {
    const learnCtx = this;
    const subDict = popParentDict('dictObj', subKey);
    mustBe.fun('learnImpl for ' + subKey, learnImpl);
    const popSubDict = objPop(subDict, { mustBe }).mustBe;
    popSubDict.learnSubDict = EX.learnCtxExtras.learnSubDict.bind(null,
      learnCtx, popSubDict);
    vTry(learnImpl, 'Learn ' + subKey)(learnCtx, popSubDict);
    popSubDict.expectEmpty('Unsupported config field(s)');
  },


};


export default EX;
