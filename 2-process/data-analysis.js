
class DataAnalysis {

    constructor() {
        console.log('data-analysis started');

        this.CorrelationRank = require('./node_modules/correlation-rank');

        this.dataNeedsRefresh = false;

        this.rawData = {};
        this.processedData = {
            threadMapping: {},
            threads: {},
            correlations: {}
        };
        this.subscriptions = {};

        this.DATA_LENGTH = 20;
        this.MINIMUM_DATA_LENGTH_FOR_CORRELATION = 16;
        this.CORRELATION_THRESHOLD = 800;
        this.DATA_PROCESSING_REFRESH_WAIT_PERIOD = 1 * 1000;

        this.startPeriodicRefresh();

    }

    // periodic refresh allows for more controll over frequency of processing
    startPeriodicRefresh() {
        setTimeout(() => {

            if (this.dataNeedsRefresh) {
                this.processData();
                this.dataNeedsRefresh = false;
            }

            this.startPeriodicRefresh();
        }, this.DATA_PROCESSING_REFRESH_WAIT_PERIOD);
    }

    calculateCorrelations(permutationPairMatrix) {
        return permutationPairMatrix.map(pair => {

            if (pair.data[0].length < this.MINIMUM_DATA_LENGTH_FOR_CORRELATION || pair.data[1].length  < this.MINIMUM_DATA_LENGTH_FOR_CORRELATION) {
                // if significant enough data to compare, then don't do correlations
                pair.correlation = 0;
            } else {
                pair.correlation = Math.round(this.CorrelationRank.rank(pair.data[0], pair.data[1]) * 1000);
            }

            return pair;
        });
    }

    // returns
    // {
    //     a: {
    //         threadIndices: [[0, 0]]
    //     },
    //     b: {
    //         threadIndices: [[1, 0]]
    //     },
    //     c: {
    //         threadIndices: [[0, 1]]
    //     }
    // };
    calculateCorrelatedThreadIndices(rawData) {

        let seriesKeys = Object.keys(rawData).sort();

        let permutationPairMatrix = [];

        let calculatedPairs = {};

        seriesKeys.forEach(series => {
            seriesKeys.forEach(seriesComparator => {
                let key = series + '-' + seriesComparator;
                let inverseKey = seriesComparator + '-' + series;
                if (series !== seriesComparator && !calculatedPairs[inverseKey]) {

                    permutationPairMatrix.push({
                        id: key,
                        series: [series, seriesComparator],
                        data: [this.rawData[series], this.rawData[seriesComparator]]
                    });

                    // prevent a-c and c-a analysis
                    calculatedPairs[key] = true;
                }
            });
        });

        let correlationPermutationPairMatrix = this.calculateCorrelations(permutationPairMatrix);

        // console.log("\n\n" + 'permutation correlation' + "\n", JSON.stringify(correlationPermutationPairMatrix), "\n\n");

        this.processedData.correlations = correlationPermutationPairMatrix;

        let threadIndexCounter = 0;
        let threadIndexMapping = {};
        let mappedSeriesNames = [];

        correlationPermutationPairMatrix.forEach(permutationPair => {
            if (permutationPair.correlation >= this.CORRELATION_THRESHOLD || permutationPair.correlation <= this.CORRELATION_THRESHOLD * -1) {
                let threadSeriesIndexCounter = 0;
                permutationPair.series.forEach(series => {

                    // initialize if not yet created
                    threadIndexMapping[series] = threadIndexMapping[series] || {
                        threadIndices: []
                    };

                    let threadSeriesMatchIndex = threadIndexMapping[series].threadIndices.indexOf(threadSeriesPair => {
                        return threadSeriesPair[0] === 'i'+threadIndexCounter && threadSeriesPair[1] === threadSeriesIndexCounter;
                    });

                    // add if doesn't yet exist
                    if (threadSeriesMatchIndex < 0) {
                        threadIndexMapping[series].threadIndices.push(['i'+threadIndexCounter, threadSeriesIndexCounter++]);
                    }

                    mappedSeriesNames.push(series);
                });
                threadIndexCounter++;
            }
        });

        // add in individual series if not part of a combined thread
        seriesKeys.forEach(series => {
            if (mappedSeriesNames.indexOf(series) < 0) {
                threadIndexMapping[series] = {
                    threadIndices: [['i'+threadIndexCounter++, 0]]
                }
                mappedSeriesNames.push(series);
            }
        });

        console.log('threadIndexMapping', JSON.stringify(threadIndexMapping));

        return threadIndexMapping;

    }

    // periodically call on all data
    // alldata has already been updated
    processData(updatedData, updatedSeries) {

        console.log('----------------------------------------------------------------------------');

        let seriesArray = Object.keys(this.rawData);

        let correlatedThreadIndices = this.calculateCorrelatedThreadIndices(this.rawData);

        seriesArray.forEach(series => {

            // clean thread mapping for this series to prevent removed correlations from sticking around
            this.processedData.threadMapping[series] = [];

            correlatedThreadIndices[series].threadIndices.forEach(threadSeriesIndexPair => {

                let threadIndex = threadSeriesIndexPair[0]; // already with 'i'
                let threadSeriesIndex = threadSeriesIndexPair[1];

                // if thread needs to be created
                if (!this.processedData.threads[threadIndex]) {
                    this.processedData.threads[threadIndex] = {};
                }

                this.processedData.threads[threadIndex]['i'+threadSeriesIndex] = {
                    series: series,
                    data: this.rawData[series]
                };

                // if thread index is not yet in thread mapping array for that series
                if (this.processedData.threadMapping[series].indexOf(threadIndex) < 0) {
                    this.processedData.threadMapping[series].push(threadIndex);
                }
            });

        });

        this.updateSubscribers(seriesArray, updatedData, updatedSeries);
    }

    replaceSeries(detail) {

        // console.log('replaceSeries', JSON.stringify(detail));

        let series = detail.series;
        let data = detail.data;

        this.rawData[series] = data;

        if (series) {
            this.dataNeedsRefresh = true;
        }
    }

    updateSeries(detail) {

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
            this.processData([series], data, series);
        }
    }

    subscribe(seriesArray, connectionId, subscriptionCallback) {

        if (!connectionId || seriesArray.length < 1) {
            console.log('unable to subscribe', connectionId, seriesArray);
            return false;
        }

        console.log('subscribing', connectionId, seriesArray);

        this.subscriptions[connectionId] = {
            seriesArray: seriesArray,
            subscriptionCallback: subscriptionCallback
        };

        // seriesArray.forEach(series => {

        //     let subSeries = this.subscriptions[series];

        //     if (!subSeries) {
        //         this.subscriptions[series] = [];
        //     }

        //     let existingSeriesSubscription = this.subscriptions[series].find(existingSeriesSubscription => {
        //         return existingSeriesSubscription.connectionId === connectionId;
        //     });

        //     if (!existingSeriesSubscription) {
        //         this.subscriptions[series].push({ connectionId: connectionId, subscriptionCallback: subscriptionCallback });
        //     } else {
        //         this.subscriptions[series][this.subscriptions[series].indexOf(connectionId)] = { connectionId: connectionId, subscriptionCallback: subscriptionCallback };
        //     }

        // });
    }

    unsubscribe(seriesArray, connectionId) {

        console.log('unsubscribing', connectionId);

        if (this.subscriptions[connectionId]) {
            seriesArray.forEach(unsubscribeSeries => {
                let unsubscribeIndex = this.subscriptions[connectionId].seriesArray.indexOf(series);
                if (unsubscribeIndex > -1) {
                    this.subscriptions[connectionId].seriesArray.splice(unsubscribeIndex, 1);
                }
            });
            if (this.subscriptions[connectionId].seriesArray.length === 0) {
                delete this.subscriptions[connectionId];
            }
        }

        // if (!this.subscriptions[series]) {
        //     return;
        // }

        // let existingSeriesSubscription = this.subscriptions[series].find(existingSeriesSubscription => {
        //     return existingSeriesSubscription.connectionId = connectionId;
        // });

        // if (existingSeriesSubscription) {
        //     let index = this.subscriptions[series].indexOf(existingSeriesSubscription);
        //     this.subscriptions[series].splice(index, 1);
        // }
    }

    getThreadsPerSeries(series) {
        return this.processedData.threadMapping[series];
    }

    // series array refers to all series now
    updateSubscribers(seriesArray, updatedData, updatedSeries) {

        Object.keys(this.subscriptions).forEach(subscriberConnectionId => {

            let subscriber = this.subscriptions[subscriberConnectionId];

            let threadIndices = subscriber.seriesArray.map(series => this.getThreadsPerSeries(series))
                // result was array of arrays, so reduce to one array
                .reduce((agg, curr) => {
                    return agg.concat(curr);
                }, [])
                .sort()
                // remove duplicates
                .reduce((agg, curr) => {
                    if (agg.indexOf(curr) < 0) {
                        agg.push(curr);
                    }
                    return agg;
                }, []);

            subscriber.subscriptionCallback({
                action: 'raw',
                data: this.rawData
            });

            threadIndices.forEach(threadIndex => {

                subscriber.subscriptionCallback({
                    action: 'correlations',
                    data: this.processedData.correlations
                });

                console.log('threadIndex', threadIndex);

                subscriber.subscriptionCallback({
                    action: 'thread',
                    threadId: threadIndex,
                    data: this.processedData.threads[threadIndex]
                });

                if (updatedData) {
                    subscriber.subscriptionCallback({
                        action: 'update',
                        threadId: threadIndex,
                        seriesId: updatedSeries,
                        data: updatedData
                    });
                }

            });

        });


        /**
         * thread-centric subscription model
         */
        // if (this.subscriptions && Object.keys(this.subscriptions).length > 0) {
        //     console.log('update subscribers');

        //     let threadIndices = seriesArray.map(series => this.getThreadsPerSeries(series))
        //         // result was array of arrays, so reduce to one array
        //         .reduce((agg, curr) => {
        //             // only add the thread val (first one)
        //             return agg.concat(curr[0]);
        //         }, [])
        //         .sort()
        //         // remove duplicates
        //         .reduce((agg, curr) => {
        //             if (agg.indexOf(curr) < 0) {
        //                 agg.push(curr);
        //             }
        //             return agg;
        //         }, []);

        //     let subscribers = seriesArray.map(series => {
        //         return this.subscriptions[series];
        //     }).reduce((agg, curr) => {
        //         return agg.concat(curr);
        //     }, []);

        //     // console.log("\n\n", 'threads: ' + "\n", JSON.stringify(this.processedData), "\n\n");

        //     if (seriesArray[0] === 'a') {
        //         console.log('seriesArray', seriesArray, 'threadIndices', threadIndices)
        //     }

        //     threadIndices.forEach(threadIndex => {

        //         if (subscribers) {
        //             subscribers.forEach(existingSeriesSubscription => {
        //                 if (existingSeriesSubscription) {

        //                     existingSeriesSubscription.subscriptionCallback({
        //                         action: 'correlations',
        //                         data: this.processedData.correlations
        //                     });


        //                     console.log('this.processedData.threads[threadIndex]', JSON.stringify(this.processedData.threads[threadIndex]));

        //                     existingSeriesSubscription.subscriptionCallback({
        //                         action: 'thread',
        //                         threadId: threadIndex, // TODO: make thread hooked by a uuid instead of index
        //                         data: this.processedData.threads[threadIndex]
        //                     });

        //                     if (updatedData) {
        //                         existingSeriesSubscription.subscriptionCallback({
        //                             action: 'update',
        //                             threadId: threadIndex,
        //                             seriesId: updatedSeries,
        //                             data: updatedData
        //                         });
        //                     }
        //                 }
        //             });
        //         }

        //     });
        // }
    }


};

module.exports = DataAnalysis;