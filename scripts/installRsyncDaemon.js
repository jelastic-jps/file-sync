// @settingsPath
// @secondEnvAddress
// @syncPassword

var NODE_GROUP_COMPUTE = "cp",
    PROCEDURE_PROCESS_NODE = "installLsync",
    APPID = getParam("TARGET_APPID"),
    SESSION = getParam("session"),
    callArgs = [],
    env,
    nodes,
    i, j,
    n,
    softNode,
    sServerWebroot,
    user = "",
    computeNodes = [],
    aCpItemEnvs = [],
    envInfoResponse,
    syncPassword = "${settings.password}",
    secondAddress = "${settings.address}",
    settingsPath = "${settings.path}";

if (syncPassword.indexOf("{settings.password}") != -1) {
    syncPassword = "";
}

if (secondAddress.indexOf("{settings.address}") != -1) {
    secondAddress = "";
}

if (settingsPath.indexOf("{settings.path}") == -1) {
    settingsPath = "/";
}

envInfoResponse = jelastic.environment.control.GetEnvInfo(APPID, SESSION);

if (envInfoResponse.result != 0) {
    return envInfoResponse;
}

nodes = envInfoResponse.nodes;

for (i = 0, n = nodes.length; i < n; i += 1) {

    if (NODE_GROUP_COMPUTE == nodes[i].nodeGroup) {
        computeNodes.push(nodes[i]);
    }
}

if (settingsPath == "/") {
    lsyncdPath = "${SERVER_WEBROOT}/";

	if (lsyncdPath.indexOf('SERVER_WEBROOT') != -1 && computeNodes[0].type == "DOCKERIZED") {
	    
	    if (!computeNodes[0].engines) {
	        
    		aCpItemEnvs = computeNodes[0].customitem.dockerManifest.env;
    
    		for (j = 0; aCpItemEnvs[j]; j += 1) {
    		    
    			if (aCpItemEnvs[j].indexOf('WEBROOT') != -1) {
    			    
    				sServerWebroot = aCpItemEnvs[j].replace('WEBROOT=', '');
    				lsyncdPath = sServerWebroot + '/';
    				break;
    			}
    		}
	    }
	}
} else {
    lsyncdPath = settingsPath;
}

user = "jelastic";

for (var i = 0, n = computeNodes.length; i < n; i += 1) {
    var mirrorServerIp = computeNodes[(i + 1) === computeNodes.length ? 0 : i + 1].address;

    callArgs.push({
        procedure : PROCEDURE_PROCESS_NODE,
        params : {
            nodeId : computeNodes[i].id,
            mirrorServerIp : mirrorServerIp,
            settingsPath : settingsPath,
            secondEnvAddress : secondAddress,
            syncPassword : syncPassword,
            lsyncdPath : lsyncdPath,
            user : user
        }
    });

} 

return {
    result : 0,
    onAfterReturn : {
        call : callArgs
    }
}; 
