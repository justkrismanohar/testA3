#!/bin/bash
workserver_path=/home/workserver
sudo mkdir $workserver_path
sudo cp sb-single.js $workserver_path
sudo cd $workserver_path
sudo apt-get update
sudo apt-get -y install build-essential
sudo apt-get -y install nodejs
sudo ln -s /usr/bin/nodejs /usr/bin/node
sudo apt-get -y install npm
sudo npm install express 
sudo npm install azure-sb
sudo npm install forever -g
sudo forever start sb-single.js
sudo forever list


