#!/bin/sh 
osascript <<END 
tell application "Terminal"
    do script "cd \"`pwd`/$1\";$2" 
end tell
END