# stream-correlation

Detect stream correlations in a limited number of streams

Thread correlated streams together and display in UI


## Folder Structure

1. [Generate](./1-generate) data from a data source
1. [Process](./2-process) data from the source
1. [Visualize](./3-visualize) the processed data


## Install & Run

1. `npm run install` Runs install scripts for all three sub-directories, each in a separate terminal
1. `npm run start` Runs start scripts for each sub-directory, each in a separate terminal
1. Use Chrome to navigate to `http://127.0.0.1:8000/components/3-visualize/`


## Preview

![Preview Step 1 - Raw Data](static/1-rawData.png "Preview Step 1 - Raw Data")

![Preview Step 2 - Correlations](static/2-correlations.png "Preview Step 2 - Correlations")

![Preview Step 3 - Threads](static/3-threads.png "Preview Step 3 - Threads")


## Basic Process Sketch

![Stream Correlation Process Sketch](static/stream-correlation-plan.JPG "Stream Correlation Process Sketch")