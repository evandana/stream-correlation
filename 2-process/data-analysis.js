class DataAnalysis {

    constructor() {
        console.log('data-analysis started');
    
        this.allData = {};
        this.subscriptions = {};

        this.DATA_LENGTH = 10;
    
    }    

    replaceSeries (detail) {
        let series = detail.series;
        let data = detail.data;

        this.allData[series] = data;

        this.updateSubscribers([series]);
    }

    updateSeries (detail) {
        let series = detail.series;
        let data = detail.data;

        if (!this.allData[series]) {
            return;
        }

        let len = this.allData[series].length;
        
        if (len >= this.DATA_LENGTH) {
            this.allData[series].shift();    
        }
        
        this.allData[series].push(data);

        this.updateSubscribers([series], data);
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

    updateSubscribers(seriesArray, newData) {
        seriesArray.forEach(series => {

            if (this.subscriptions[series]) {
                this.subscriptions[series].forEach(existingSeriesSubscription => {
                    existingSeriesSubscription.subscriptionCallback({
                        action: 'series',
                        series: series,
                        data: this.allData[series]
                    });

                    if (newData) {
                        existingSeriesSubscription.subscriptionCallback({
                            action: 'update',
                            series: series,
                            data: newData
                        });
                    }
                });
            }

        });
    }

};

module.exports = DataAnalysis;