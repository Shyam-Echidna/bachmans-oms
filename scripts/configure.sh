#!/bin/bash
cd /var/www
npm install
gulp serve
service nginx reload
