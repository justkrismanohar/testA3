#!/bin/bash
workserver_path=/home/admin806003586/workserver
sudo echo $workserver_path
sudo mkdir $workserver_path
sudo cp sb-single.js $workserver_path

sudo apt-get update
sudo apt-get -y install build-essential
sudo apt-get -y install nodejs
sudo ln -s /usr/bin/nodejs /usr/bin/node
sudo apt-get -y install npm

cd $workserver_path
sudo echo start_node_install
sudo pwd
sudo npm install express 
sudo npm install azure-sb
sudo npm install azure-storage
sudo npm install forever -g
sudo runuser -l admin806003586 -c 'sudo forever start '$workserver_path'/sb-single.js'
sudo runuser -l admin806003586 -c 'sudo forever list'



