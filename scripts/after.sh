#!/bin/bash
sudo chown ec2-user:nginx -R /var/www
cd /var/www
npm install bower gulp
npm install
bower install

