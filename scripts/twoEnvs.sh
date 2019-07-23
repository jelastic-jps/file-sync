#!/bin/bash
EXT_IP=$1

if [ -n "${EXT_IP}" ];
then
settingsPath=$2
lsyncdPath=$3
grep -q "@"${EXT_IP}"/" ${lsyncdPath}/lsyncd/etc/lsyncd.conf || echo "sync {
		default.rsync,
		source=\"${lsyncdPath}${settingsPath}\",
                target=\"rsync://admin@"${EXT_IP}"/syncmodule\",
		delay=10,
                delete='running',
		exclude = {
		  \"lsyncd/\",
		  \"lsyncd_tmp/\"
		},
			rsync = {
			        archive  = true,
			        compress = true,
			        update = true,
				_extra = {
					\"--port=7755\",\"--password-file="${lsyncdPath}"lsyncd/etc/rsyncd.pass\", \"--temp-dir=/lsyncd_tmp\"
				},
			}
		}" >> ${lsyncdPath}/lsyncd/etc/lsyncd.conf;
fi
