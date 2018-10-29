var PARAM_UNINSTALL = 'uninstall',
    PARAM_INSTALL = 'install',
    DIRECTION_OUT = 'OUTPUT',
    DIRECTION_IN = 'INPUT',
    RSYNC_PORT = '7755',
    ALLOW = 'ALLOW',
    FIREWALL = 'FIREWALL',
    SSH = 'SSH',
    ALL = 'ALL',
    CP = 'cp',
    envName = "${env.name}",
    bFireWallEnabled,
    outputRule,
    inputRule,
    rules,
    oTmp,
    resp;

inputRule = {"direction":DIRECTION_IN,"name":SSH,"protocol":ALL,"ports":RSYNC_PORT,"src":ALL,"priority":1080,"action":ALLOW};
outputRule = {"direction":DIRECTION_OUT,"name":SSH,"protocol":ALL,"ports":RSYNC_PORT,"dst":ALL,"priority":1000,"action":ALLOW};

if (jelastic.environment.security) {
  resp = jelastic.billing.account.GetOwnerQuotas(appid, session, 'firewall.enabled');
  if (!resp || resp.result !== 0) return resp;
    
  bFireWallEnabled = resp.array[0] ? resp.array[0].value : 0;
    
  if (bFireWallEnabled && param == PARAM_INSTALL) {
    resp = jelastic.env.control.GetNodeGroups(envName, session);
    if (!resp || resp.result !== 0) return resp;
      
    if (resp.object && resp.object[0]) {
      oTmp = resp.object[0];
        
      if (oTmp.features && oTmp.features == FIREWALL) {
        resp = jelastic.environment.security.AddRule(envName, session, inputRule, CP);
        if (!resp || resp.result !== 0) return resp;
        return jelastic.environment.security.AddRule(envName, session, outputRule, CP);
      }
    }

  } else if (param == PARAM_UNINSTALL) {
    resp = removeRule(DIRECTION_IN);
    if (!resp || resp.result !== 0) return resp;
    return removeRule(DIRECTION_OUT);
  }
}

function removeRule(InOutBond) {
    var rules = jelastic.environment.security.GetRules('${env.name}', session, CP, InOutBond).rules;

    for (var i = 0; i < rules.length; i ++) {
        if (rules[i].ports == 7755) {
            return jelastic.environment.security.RemoveRule(envName, session, rules[i].id);
        }
    }
    
    return {
        result: 0
    }
}

return {
    result: 0
}
