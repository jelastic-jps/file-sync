#!/bin/bash
EXT_IP=$1

if [ -n "${EXT_IP}" ];
then
echo "sync {
		default.rsync,
		source=\"/var/www/webroot/\",
                target=\"rsync://admin@"${EXT_IP}"/varwwwwebroot\",
		delay='10',
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
					\"--port=7755\",\"--password-file=/var/www/webroot/lsyncd/etc/rsyncd.pass\", \"--temp-dir=/lsyncd_tmp\"
				},
			}
		}" >> /var/www/webroot/lsyncd/etc/lsyncd.conf;
fi
