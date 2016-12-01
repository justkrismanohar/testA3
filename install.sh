#!/bin/bash
workserver_path=/srv/workserver
sudo mkdir $workserver_path
sudo cp sb-single.js $workserver_path

# install node 
sudo apt -y install nodejs-legacy
#sudo apt-get -y install nodejs 
sudo apt-get -y install npm 
sudo npm install express -g
sudo npm install azure-sb -g
sudo npm install forever -g
sudo forever start sb-single.js
#node sb-single.js