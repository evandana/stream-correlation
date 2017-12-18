module.exports = (function () {
    console.log('data-sim started');

    const SERIES_IDS = ['a', 'b', 'c', 'd'];
    const DATA_LENGTH = 10;
    const DATA_INTERVAL = 1000*2;

    var allData = {};
    var timers = {};
    var subscriptions = {};

    // set on subscribe call
    var callback = function () {};

    SERIES_IDS.forEach(id => {
        // init data vals for this var
        allData[id] = [];
        subscriptions[id] = [];
        flowData(id);
    });

    return {
        subscribe: subscribe
    };


    function flowData (id) {

        // remove first, if array is too long
        if (allData[id].length >= DATA_LENGTH) {
            allData[id].shift();
        }
        
        // add new val
        let newVal = Math.round(Math.random()*1000);

        allData[id].push(newVal);

        if (subscriptions[id] && subscriptions[id].length) {
            subscriptions[id].forEach(subscriptionCallback => {
                // push new val to ws
                subscriptionCallback(
                    JSON.stringify({
                        action: 'update',
                        name: id,
                        data: [ newVal ]
                    })
                );

                // push new val to ws
                subscriptionCallback(
                    JSON.stringify({
                        action: 'series',
                        name: id,
                        data: allData[id]
                    })
                );
            });
        }

        console.log(id, ': ', allData[id]);

        timers[id] = setTimeout(() => flowData(id), DATA_INTERVAL);
    }

    function subscribe ( seriesArray, subscriptionCallback ) {
        // send all
        subscriptionCallback(JSON.stringify({
            action: 'init',
            data: seriesArray.map(series => {
                if (subscriptions[series]) {
                    return { 
                        name: series, 
                        data: allData[series]
                    };
                }
            })
        }));

        seriesArray.forEach(series => {
            // send per series
            if (subscriptions[series]) {
                subscriptions[series].push(subscriptionCallback);
            }
        });
    }

})();