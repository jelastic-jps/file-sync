#/bin/bash
cd $1

if [ -L "ROOT" ]; then
DEPLOYED_DIR=$(ls -al | grep webroot | awk '{print $11}' | grep -);
NEW_DIR="@ROOT"

if [[ ${DEPLOYED_DIR} != ${NEW_DIR} ]]; then
if [ -e ${NEW_DIR} ]; then
rm -rf ${NEW_DIR};
mkdir ${NEW_DIR};
cp -rf ${DEPLOYED_DIR}* ${NEW_DIR};
rm -rf ROOT;
ln -s ${NEW_DIR} ROOT;
else
mkdir ${NEW_DIR};
cp -rf ${DEPLOYED_DIR}* ${NEW_DIR};
rm -rf ROOT;
ln -s ${NEW_DIR} ROOT;
fi
fi
grep 'munge symlinks = no' $1/lsyncd/etc/rsync.conf || sed -i 's|use chroot = no|use chroot = no\nmunge symlinks = no|g' $1/lsyncd/etc/rsync.conf;
grep 'rsyncd-munged/' $1/lsyncd/etc/lsyncd.conf || sed -i 's|exclude = {|exclude = {\n                  "rsyncd-munged/",|g' $1/lsyncd/etc/lsyncd.conf;
fi

