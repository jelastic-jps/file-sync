// Configure dialog: delay + exclude.list via api.env.file.Read (nodeId required).
// Placeholders: ${env.name}, ${targetNodes.nodeGroup}

var envName = "${env.name}";
var nodeGroup = "${targetNodes.nodeGroup}";
var currentDelay = "10";
var currentExclude = "";
var envResp, sampleNodeId, envInfo, ni, confPath, excludeFullPath, confRead, dm, exRead;
var lp = "/data/";

if (nodeGroup != "storage") {
  envResp = api.env.control.GetContainerEnvVarsByGroup(envName, session, nodeGroup);
  if (envResp.result == 0 && envResp.object && envResp.object.WEBROOT) {
    lp = envResp.object.WEBROOT;
    if (lp.charAt(lp.length - 1) != "/") {
      lp += "/";
    }
  } else {
    lp = "/var/www/webroot/";
  }
}

envInfo = jelastic.environment.control.GetEnvInfo(envName, session);
if (envInfo.result == 0 && envInfo.nodes) {
  for (ni = 0; ni < envInfo.nodes.length; ni++) {
    if (envInfo.nodes[ni].nodeGroup == nodeGroup) {
      sampleNodeId = envInfo.nodes[ni].id;
      break;
    }
  }
}

function readNodeFile(path) {
  if (sampleNodeId == null) {
    return { result: 999, body: null };
  }
  return api.env.file.Read(envName, session, String(path), null, nodeGroup || null, sampleNodeId);
}

confPath = lp + "lsyncd/etc/lsyncd.conf";
excludeFullPath = lp + "lsyncd/etc/exclude.list";
confRead = readNodeFile(confPath);
if (confRead.result == 0 && confRead.body) {
  dm = String(confRead.body).match(/delay=(\d+)/);
  if (dm) {
    currentDelay = dm[1];
  }
}
exRead = readNodeFile(excludeFullPath);
if (exRead.result == 0 && exRead.body != null) {
  currentExclude = String(exRead.body);
}
settings.fields.push({
  name: "delay",
  caption: "Sync delay (sec)",
  type: "string",
  value: currentDelay
});
settings.fields.push({
  name: "exclude",
  caption: "Exclude paths",
  type: "text",
  height: 200,
  value: currentExclude
});
return settings;
