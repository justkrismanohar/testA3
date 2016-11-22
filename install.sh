#!/bin/bash
workserver_path=/srv/workserver
mkdir $workserver_path
#cp sb-single.js $workserver_path

# install node 
apt-get -y nodejs
apt-get -y npm
npm install express
npm install azure-sb

#node sb-single.js