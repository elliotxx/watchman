#!/bin/bash
 
# run watchman
watchman > /data/watchman.api.log 2>&1 &
# run nginx
nginx -g 'daemon off;' > /data/nginx.log 2>&1 &
 
# just keep this script running
while [[ true ]]; do
    sleep 1
done