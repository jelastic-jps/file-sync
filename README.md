[![File Synchronization](../../raw/master/images/icon.png)](../../../FileSync)
## Jelastic File Synchronization Add-on

This repository provides [Lsyncd](http://docs.jelastic.com/file-synchronization/) add-on for Jelastic Platform.

**Lsyncd** is a light-weight, live mirror solution used to synchronize app servers. Being wisely coupled with [**inotify**](http://en.wikipedia.org/wiki/Inotify), lsyncd initiates file sync only if it has detected any actual changes in the system. In such a way, the load on CPU is decreased and you do not burn up many resources on processing the synchronization.

**Type of nodes this add-on can be applied to**: 
- Application server (cp).

### What it can be used for?
With a help of our bookmarklet, lsyncd is automatically installed on each app server available in the environment. Before its installation, you will be asked to choose the folders you want to synchronize. As a result, when a change is made in the chosen folders on any of the app servers, those changes will be synced to each server node automatically.

One of two initial options can be selected:
- One environment synchronization;
- Two environments synchronization.<br/>

Sync path and delay (in sec) parameters can be selected for both options and two optional parameters for second option: IP address of any node from second environment and random password which will use to access to both environments.
	
For more information on what File Synchronization Add-on can be used for, follow the [Lsyncd](https://docs.jelastic.com/file-synchronization) reference.

### Deployment

In order to get this solution instantly deployed, click the "Get It Hosted Now" button, specify your email address within the widget, choose one of the [Jelastic Public Cloud providers](https://jelastic.cloud) and press Install.

[![GET IT HOSTED](https://raw.githubusercontent.com/jelastic-jps/jpswiki/master/images/getithosted.png)](https://jelastic.com/install-application/?manifest=https%3A%2F%2Fgithub.com%2Fjelastic-jps%2FFileSync%2Fraw%2Fmaster%2Fmanifest.jps)

To deploy this package to Jelastic Private Cloud, import [this JPS manifest](../../raw/master/manifest.jps) within your dashboard ([detailed instruction](https://docs.jelastic.com/environment-export-import#import)).

For more information on what Jelastic add-on is and how to apply it, follow the [Jelastic Add-ons](https://github.com/jelastic-jps/jpswiki/wiki/Jelastic-Addons) reference.