var version = jelastic.system.service.GetVersion().version.split("-").shift(),
    envName = "${env.name}",
    outputRule,
    inputRule,
    rules,
    resp;

inputRule = {"direction":"INPUT","name":"SSH","protocol":"ALL","ports":"7755","src":"ALL","priority":1080,"action":"ALLOW"};
outputRule = {"direction":"OUTPUT","name":"SSH","protocol":"ALL","ports":"7755","dst":"ALL","priority":1000,"action":"ALLOW"};

if (compareVersions(version, '5.3')){
  if (param == 'install') {
      
    resp = jelastic.environment.security.AddRule(envName, session, inputRule, 'cp');
    if (!resp || resp.result !== 0) return resp;
    return jelastic.environment.security.AddRule(envName, session, outputRule, 'cp');

  } else if (param == 'uninstall') {
    resp = removeRule('IN');
    if (!resp || resp.result !== 0) return resp;
    return removeRule('OUT');
  }
}

function removeRule(InOutBond) {
    var rules = jelastic.environment.security.GetRules('${env.name}', session, 'cp', InOutBond).rules;

    for (var i = 0; i < rules.length; i ++) {
        if (rules[i].ports == 7755) {
            return jelastic.environment.security.RemoveRule(envName, session, rules[i].id);
        }
    }
}

function compareVersions(a, b) {
  a = a.split("."), b = b.split(".")
  for (var i = 0, l = Math.max(a.length, b.length); i < l; i++) {x = parseInt(a[i], 10) || 0; y = parseInt(b[i], 10) || 0; if (x != y) return x > y ? 1 : -1 }
  return 0;
}
