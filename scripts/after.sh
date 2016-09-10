source /home/ec2-user/.bash_profile
cd /var/www/html/Bachmans-oms
npm install --quiet -g grunt-cli karma bower
npm install
bower install --allow-root
gulp compile
