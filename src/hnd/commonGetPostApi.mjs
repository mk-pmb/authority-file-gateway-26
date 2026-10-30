// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import loMapValues from 'lodash.mapvalues';
import mustBe from 'typechecks-pmb/must-be.js';

import httpErrors from '@ubhd-as22/http-server-base/src/httpErrors.mjs';
import useMiscCfg from '@ubhd-as22/http-server-base/src/cfg/useMiscCfg.mjs';


const {
  badRequest,
  badVerb,
} = httpErrors.throwable;


const doNothing = Boolean;
const api = {};

function sTrim(s) { return String(s || '').trim(); }


const EX = {
  cfgTopicName: 'commonGetPostApi',
  config: 'will be set by first init()',
  getUnboundApi() { return api; },


  async init(req) {
    req.confirmCors();
    const initCtx = { req, qry: { ...req.query } };
    await useMiscCfg.learnMiscCfgTopic(EX.cfgTopicName, EX.learnConfig,
      req.getSrv());
    loMapValues(api, (f, k) => { initCtx[k] = f.bind(null, initCtx); });
    await EX.byVerbLc({
      '*': badVerb,
      get: doNothing,
      async post() {
        const bodyData = await req.parseRequestBody({ fmt: 'webform' });
        Object.assign(initCtx.qry, bodyData);
      },
    }, req);
    return initCtx;
  },


  async learnConfig(popRawCfg) {
    const cfg = {};
    loMapValues({
      globalQueryDefaults: 'dictObj',
    }, function copy(rule, key) { EX[key] = popRawCfg(rule, key); });
    EX.config = cfg;
    return cfg;
  },


  async byVerbLc(verbFuncs, req, ...args) {
    const verb = mustBe.nest('HTTP method', req?.method).toLowerCase();
    const func = getOwn(verbFuncs, verb, '*');
    if (!func) { return; }
    const result = await func.apply(verbFuncs, args);
    return result;
  },


};


Object.assign(api, {

  qryTrimStr(initCtx, key) {
    return sTrim(getOwn(initCtx.qry, key));
  },

  qryNonEmptyStr(initCtx, key, descr) {
    const val = sTrim(getOwn(initCtx.qry, key));
    if (val) { return val; }
    throw badRequest('Empty ' + descr + ' (field ' + key + ')');
  },

  qryIntPosOr0(initCtx, key) {
    const val = +getOwn(initCtx.qry, key);
    return ((Number.isInteger(val) && (val >= 1) && val) || 0);
  },

});


export default EX;
