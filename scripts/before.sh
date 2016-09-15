#!/bin/bash
npm install pm2 -g
rm -Rf /var/www/*
usermod -a -G nginx ec2-user
gem install sass
