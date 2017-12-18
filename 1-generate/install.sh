pwd
LOCATION=$1
echo "loc:${LOCATION}"
pwd
npm install
osascript -e 'tell application "Terminal" to close (every window whose name contains "1-generate")' &