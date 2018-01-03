# opens a new window for each install
# closes window (by same name) after install is complete
./scripts/opennewterminal.sh 1-generate "npm install; ../scripts/closeterminalwindow.sh 1-generate"
./scripts/opennewterminal.sh 2-process "npm install; ../scripts/closeterminalwindow.sh 2-process"
./scripts/opennewterminal.sh 3-visualize "npm install; bower install; ../scripts/closeterminalwindow.sh 3-visualize"
