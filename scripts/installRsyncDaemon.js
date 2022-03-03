// @settingsPath
// @secondEnvAddress
// @syncPassword

var NODE_GROUP_STORAGE = "storage",
    PROCEDURE_PROCESS_NODE = "installLsync",
    APPID = getParam("TARGET_APPID"),
    SESSION = getParam("session"),
    USER = "jelastic",
    syncPassword = "${settings.password}",
    secondAddress = "${settings.address}",
    settingsPath = "${settings.path}",
    isStorageNode = false,
    envLsyncdNodes = [],
    aCpItemEnvs = [],
    resp,
    mirrorServerIp,
    callArgs = [],
    lsyncdPath,
    nodes,
    env,
    i,
    j,
    n;

if (syncPassword.indexOf("{settings.password}") != -1) {
    syncPassword = "defaultPassword";
}

if (secondAddress.indexOf("{settings.address}") != -1) {
    secondAddress = "";
}

if (settingsPath.indexOf("{settings.path}") != -1) {
    settingsPath = "/";
}

resp = jelastic.environment.control.GetEnvInfo(APPID, SESSION);

if (resp.result != 0) return resp;

nodes = resp.nodes;

for (i = 0, n = nodes.length; i < n; i += 1) {
    if ("${targetNodes.nodeGroup}" == nodes[i].nodeGroup) {
        isStorageNode = !!(NODE_GROUP_STORAGE == nodes[i].nodeType);
        envLsyncdNodes.push(nodes[i]);
    }
}

if (envLsyncdNodes[0].type == "DOCKERIZED") {
    if (!envLsyncdNodes[0].engines) {
        aCpItemEnvs = envLsyncdNodes[0].customitem.dockerManifest.env;

        for (j = 0; aCpItemEnvs[j]; j += 1) {

            if (/^WEBROOT=/.test(aCpItemEnvs[j])) {
                lsyncdPath = aCpItemEnvs[j].replace('WEBROOT=', '') + '/';
                break;
            }
        }
    }
}

if (!lsyncdPath) {
    lsyncdPath = isStorageNode ? "/data/" : "/var/www/webroot/ROOT/";
}

if (settingsPath != "/" || settingsPath != "") {
    settingsPath = settingsPath.replace(lsyncdPath, '');
}

for (i = 0, n = envLsyncdNodes.length; i < n; i += 1) {
    mirrorServerIp = envLsyncdNodes[(i + 1) === envLsyncdNodes.length ? 0 : i + 1].address;

    callArgs.push({
        action : PROCEDURE_PROCESS_NODE,
        params : {
            nodeId : envLsyncdNodes[i].id,
            mirrorServerIp : mirrorServerIp,
            settingsPath : settingsPath,
            secondEnvAddress : secondAddress,
            syncPassword : syncPassword,
            lsyncdPath : lsyncdPath,
            user : USER
        }
    });
}

return {
    result : 0,
    lsyncdPath : lsyncdPath,
    onAfterReturn : {
        call : callArgs
    }
};
