// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import vTry from 'vtry';

import learnTopicDict from
  '@ubhd-as22/http-server-base/src/cfg/learnTopicDict.mjs';

import multiCatSearchHndImpl from './multiCatSearchHndImpl.mjs';


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
    return multiCatSearchHndImpl.bind(null, impl, state);
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
