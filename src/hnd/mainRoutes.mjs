// -*- coding: utf-8, tab-width: 2 -*-

import memCatHnd from './memCat.mjs';
import proxyCatHnd from './proxyCat.mjs';


const EX = async function installMainRoutes(rt) {
  const srv = rt.getServer();
  rt.all('/memcat/', await memCatHnd.install(srv));
  rt.all('/proxycat/', await proxyCatHnd.install(srv));
};


export default EX;
