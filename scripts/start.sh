#!/bin/bash
export NODE_ENV="production"
export MONGODB_URI="10.0.0.83:27017"
cd /var/www
pm2 start dist/server/index.js -n "API"
sudo service nginx reload
