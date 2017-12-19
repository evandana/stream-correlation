class DataSimulator {

    constructor() {
        console.log('data-sim started');
    
        this.SERIES_IDS = ['a', 'b', 'c', 'd'];
        this.DATA_LENGTH = 10;
        this.DATA_INTERVAL = 1000*2;
    
        this.allData = {};
        this.timers = {};
        this.subscriptions = {};
    
        // set on subscribe call
        var callback = function () {};
    
        this.SERIES_IDS.forEach(id => {
            // init data vals for this var
            this.allData[id] = [];
            this.subscriptions[id] = [];
            this.flowData(id);
        });

    }    

    flowData (id) {

        // remove first, if array is too long
        if (this.allData[id].length >= this.DATA_LENGTH) {
            this.allData[id].shift();
        }
        
        // add new val
        let newVal = Math.round(Math.random()*1000);

        this.allData[id].push(newVal);

        if (this.subscriptions[id] && this.subscriptions[id].length) {
            this.subscriptions[id].forEach(subscriptionCallback => {
                // push new val to ws
                subscriptionCallback(
                    JSON.stringify({
                        action: 'update',
                        series: id,
                        data: newVal
                    })
                );

                // push all vals for that series to ws
                subscriptionCallback(
                    JSON.stringify({
                        action: 'series',
                        series: id,
                        data: this.allData[id]
                    })
                );
            });
        }

        console.log(id, ': ', this.allData[id]);

        this.timers[id] = setTimeout(() => this.flowData(id), this.DATA_INTERVAL);
    }

    subscribe ( seriesArray, subscriptionCallback ) {
        // send all
        subscriptionCallback(JSON.stringify({
            action: 'init',
            data: seriesArray.map(series => {
                if (this.subscriptions[series]) {
                    return { 
                        name: series, 
                        data: this.allData[series]
                    };
                }
            })
        }));

        seriesArray.forEach(series => {
            // send per series
            if (this.subscriptions[series]) {
                this.subscriptions[series].push(subscriptionCallback);
            }
        });
    }

};

module.exports = DataSimulator;