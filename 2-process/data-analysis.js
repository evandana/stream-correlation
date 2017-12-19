class DataAnalysis {

    constructor() {
        console.log('data-analysis started');
    
        this.rawData = {};
        this.processedData = {
            threadMapping: {},
            threads: []
        };
        this.subscriptions = {};

        this.DATA_LENGTH = 10;
    
    }    

    processData (seriesArray, data) {

        seriesArray.forEach(series => {
            var threadSeriesIndex = null;
            let threadIndex = this.processedData.threads.findIndex(thread => {
                let tempThreadSeriesIndex = thread.findIndex(threadSeries => {
                    return threadSeries.series === series; 
                });
                if (tempThreadSeriesIndex > -1) {
                    threadSeriesIndex = tempThreadSeriesIndex;
                    return true;
                } else {
                    return false;
                }
            });

            if (threadIndex > -1) {
                if (threadSeriesIndex > -1) {
                    this.processedData.threads[threadIndex][threadSeriesIndex] = {
                        series: series, 
                        data: this.rawData[series]
                    };
                }
            } else {
                threadIndex = this.processedData.threads.length;
                this.processedData.threads.push([{
                    series: series,
                    data: this.rawData[series]
                }]);
            }
            
            this.processedData.threadMapping[series] = threadIndex;
        });

        this.updateSubscribers(seriesArray, data);
    }

    replaceSeries (detail) {

        // console.log('replaceSeries', JSON.stringify(detail));

        let series = detail.series;
        let data = detail.data;

        this.rawData[series] = data;

        if (series) {
            this.processData([series]);
        }
    }

    updateSeries (detail) {
        
        // console.log('updateSeries', JSON.stringify(detail));

        let series = detail.series;
        let data = detail.data;

        if (!this.rawData[series]) {
            return;
        }

        let len = this.rawData[series].length;
        
        if (len >= this.DATA_LENGTH) {
            this.rawData[series].shift();    
        }
        
        this.rawData[series].push(data);


        if (series) {
            this.processData([series], data);
        }
    }

    sendUpdate (data) {
        console.log('sendUpdate');
    }

    subscribe(seriesArray, connectionId, subscriptionCallback) {

        seriesArray.forEach(series => {

            let subSeries = this.subscriptions[series];

            if (!subSeries) {
                this.subscriptions[series] = [];
            }

            let existingSeriesSubscription = subSeries.find(existingSeriesSubscription => {
                return existingSubscription.connectionId === connectionId;
            });

            if (!existingSeriesSubscription) {
                this.subscriptions[series].push({id: connectionId, callback: subscriptionCallback});
            } else {
                this.subscriptions[series][this.subscriptions[series].indexOf(existingConnectionId)] = {id: connectionId, callback: subscriptionCallback};
            }

        });

        console.log('subscribe');
    }
    
    unsubscribe(series, connectionId) {
        if (!this.subscriptions[series] ) {
            return ;
        }
        
        let existingSeriesSubscription = this.subscriptions[series].find( existingSeriesSubscription => {
            return existingSeriesSubscription.connectionId = connectionId;
        });
        
        if (existingSeriesSubscription) {
            let index = this.subscriptions[series].indexOf(existingSeriesSubscription);
            this.subscriptions[series].splice(index, 1);
        }
    }

    getThread (series) {
        return this.processedData.threadMapping[series];
    }

    updateSubscribers(seriesArray, newData) {

        console.log('update subscribers');

        let threadIndices = seriesArray.map(series => this.getThread(series))
            .sort()
            .reduce((agg, curr) => {
                if (agg.indexOf(curr) > -1) {
                    agg.push(curr);
                } 
                return agg;
            }, []) ;

        
        console.log('processedData', JSON.stringify(this.processedData));

        threadIndices.forEach(threadIndex => {

            console.log('processedData', JSON.stringify({
                action: 'thread',
                thread: threadIndex,
                data: this.processedData.threads[threadIndex]
            }));

            if (this.subscriptions[series]) {
                this.subscriptions[series].forEach(existingSeriesSubscription => {
                    existingSeriesSubscription.subscriptionCallback({
                        action: 'thread',
                        thread: threadIndex,
                        data: this.processedData.threads[threadIndex]
                    });

                    if (newData) {
                        existingSeriesSubscription.subscriptionCallback({
                            action: 'update',
                            thread: threadIndex,
                            series: series, // TODO: series is not defined!
                            data: newData
                        });
                    }
                });
            }

        });
    }

};

module.exports = DataAnalysis;