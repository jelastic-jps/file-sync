#!/bin/bash
# Controls the rsync daemon and lsyncd used by the File Synchronization add-on.
#
# Usage: init.sh start|stop|restart|check|pause|resume|status
#   start   - start the rsync daemon and lsyncd unless they are already running
#   stop    - stop both daemons and wait until they exit
#   restart - stop, then start
#   check   - cron health check: start whatever is not running (skipped during maintenance)
#   pause   - set the maintenance flag and stop both daemons (used before deploy/reinstall)
#   resume  - clear the maintenance flag and restart both daemons
#   status  - print the state of both daemons
#
# _INSTALL_DIRECTORY is replaced with the add-on directory by the manifest.

installDir=_INSTALL_DIRECTORY
installDir=${installDir%/}/

RSYNC_BIN=/usr/bin/rsync
LSYNCD_BIN=/usr/bin/lsyncd
RSYNC_PORT=7755
RSYNC_CONF=${installDir}etc/rsync.conf
LSYNCD_CONF=${installDir}etc/lsyncd.conf
RUN_DIR=${installDir}var/run
LOG_DIR=${installDir}var/log
# Written by the rsync daemon itself, see "pid file" in rsync.conf.
RSYNC_PID_FILE=${RUN_DIR}/rsyncd.pid
# Kept for backward compatibility with older versions of the add-on.
BG_PID_FILE=${installDir}bg.pid
BG_LSYNCD_PID_FILE=${installDir}bg_lsyncd.pid
LOCK_FILE=${RUN_DIR}/init.lock
MAINTENANCE_FILE=${RUN_DIR}/maintenance
# A maintenance flag older than this is treated as stale (e.g. a deploy that failed midway).
MAINTENANCE_TTL_MIN=30
STOP_TIMEOUT=15
START_TIMEOUT=10

# Patterns match the processes of this installation only. The lsyncd pattern also
# matches the relative config path used by older versions of this script.
RSYNC_PATTERN="rsync --daemon --config=${RSYNC_CONF}"
LSYNCD_PATTERN="lsyncd (\./|${installDir})etc/lsyncd\.conf"

log() {
    echo "$(date '+%F %T') [$ACTION] $*" >> "${LOG_DIR}/init.log"
    echo "$*" >&2
}

# Prints the pid of the main rsync daemon process, if it is running.
rsync_pid() {
    local pid
    pid=$(cat "$RSYNC_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && pgrep -f -- "$RSYNC_PATTERN" | grep -qx "$pid"; then
        echo "$pid"
        return 0
    fi
    # The pid file is missing or stale: fall back to the oldest matching process
    # (newer ones are children serving connections).
    pgrep -o -f -- "$RSYNC_PATTERN"
}

lsyncd_pid() {
    pgrep -o -f -- "$LSYNCD_PATTERN"
}

# Waits up to $2 seconds for the process found by function $1 to appear and stay alive.
wait_started() {
    local pid_fn=$1 timeout=$2 pid i
    for ((i = 0; i < timeout; i++)); do
        sleep 1
        pid=$($pid_fn) || continue
        # The daemon may exit right after start (e.g. port already in use), re-check it.
        sleep 1
        kill -0 "$pid" 2>/dev/null && [ "$($pid_fn)" = "$pid" ] && { echo "$pid"; return 0; }
    done
    return 1
}

stop_by_pattern() {
    local pattern=$1 name=$2 pids i
    pids=$(pgrep -f -- "$pattern" | tr '\n' ' ')
    [ -n "$pids" ] || return 0
    pkill -TERM -f -- "$pattern"
    for ((i = 0; i < STOP_TIMEOUT; i++)); do
        if ! pgrep -f -- "$pattern" > /dev/null; then
            log "$name stopped, pid ${pids% }"
            return 0
        fi
        sleep 1
    done
    log "$name did not stop in ${STOP_TIMEOUT}s, sending SIGKILL"
    pkill -KILL -f -- "$pattern"
    sleep 1
    if pgrep -f -- "$pattern" > /dev/null; then
        log "failed to stop $name"
        return 1
    fi
    log "$name killed, pid ${pids% }"
    return 0
}

start_rsync() {
    local pid
    if pid=$(rsync_pid); then
        echo "$pid" > "$BG_PID_FILE"
        return 0
    fi
    # rsync refuses to start while its pid file exists.
    rm -f "$RSYNC_PID_FILE"
    # 9>&- : the daemon must not inherit the lock descriptor, otherwise it holds the lock forever.
    "$RSYNC_BIN" --daemon --config="$RSYNC_CONF" --port=$RSYNC_PORT >> "${LOG_DIR}/rsyncd_start.log" 2>&1 9>&-
    if pid=$(wait_started rsync_pid $START_TIMEOUT); then
        echo "$pid" > "$BG_PID_FILE"
        log "rsync daemon started, pid $pid"
        return 0
    fi
    rm -f "$BG_PID_FILE"
    log "rsync daemon failed to start, see ${LOG_DIR}/rsyncd_start.log and ${installDir}var/rsync.log"
    return 1
}

start_lsyncd() {
    local pid
    if pid=$(lsyncd_pid); then
        echo "$pid" > "$BG_LSYNCD_PID_FILE"
        return 0
    fi
    if [ ! -x "$LSYNCD_BIN" ]; then
        rm -f "$BG_LSYNCD_PID_FILE"
        log "$LSYNCD_BIN not found, the lsyncd package is not installed"
        return 1
    fi
    "$LSYNCD_BIN" "$LSYNCD_CONF" >> "${LOG_DIR}/lsyncd_start.log" 2>&1 9>&-
    if pid=$(wait_started lsyncd_pid $START_TIMEOUT); then
        echo "$pid" > "$BG_LSYNCD_PID_FILE"
        log "lsyncd started, pid $pid"
        return 0
    fi
    rm -f "$BG_LSYNCD_PID_FILE"
    log "lsyncd failed to start, see ${LOG_DIR}/lsyncd_start.log and ${LOG_DIR}/lsyncd.log"
    return 1
}

do_start() {
    local rc=0
    start_rsync || rc=1
    start_lsyncd || rc=1
    return $rc
}

do_stop() {
    local rc=0
    stop_by_pattern "$LSYNCD_PATTERN" lsyncd || rc=1
    stop_by_pattern "$RSYNC_PATTERN" "rsync daemon" || rc=1
    rm -f "$BG_PID_FILE" "$BG_LSYNCD_PID_FILE"
    [ $rc -eq 0 ] && rm -f "$RSYNC_PID_FILE"
    return $rc
}

maintenance_active() {
    [ -f "$MAINTENANCE_FILE" ] || return 1
    if [ -n "$(find "$MAINTENANCE_FILE" -mmin +$MAINTENANCE_TTL_MIN 2>/dev/null)" ]; then
        log "maintenance flag is older than ${MAINTENANCE_TTL_MIN} minutes, removing it"
        rm -f "$MAINTENANCE_FILE"
        return 1
    fi
    return 0
}

ACTION=$1
mkdir -p "$RUN_DIR" "$LOG_DIR"
cd "$installDir" || exit 1

# Serialize the cron check with install/deploy actions.
if command -v flock > /dev/null 2>&1; then
    exec 9> "$LOCK_FILE"
    if [ "$ACTION" = "check" ]; then
        flock -n 9 || exit 0
    else
        flock -w 120 9 || { log "another init.sh instance is still running"; exit 1; }
    fi
fi

case "$ACTION" in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    restart)
        do_stop && do_start
        ;;
    check)
        maintenance_active && exit 0
        do_start > /dev/null 2>&1
        ;;
    pause)
        touch "$MAINTENANCE_FILE"
        do_stop
        ;;
    resume)
        rm -f "$MAINTENANCE_FILE"
        do_stop && do_start
        ;;
    status)
        rc=0
        pid=$(rsync_pid) && echo "rsync daemon: running, pid $pid" || { echo "rsync daemon: stopped"; rc=1; }
        pid=$(lsyncd_pid) && echo "lsyncd: running, pid $pid" || { echo "lsyncd: stopped"; rc=1; }
        maintenance_active && echo "maintenance: on"
        exit $rc
        ;;
    *)
        echo "Usage: $0 start|stop|restart|check|pause|resume|status" >&2
        exit 2
        ;;
esac
